import { createClient } from "@/lib/supabase/server"
import { createTwitterClient } from "@/lib/twitter"
import { TwitterOAuth } from "@/lib/twitter-oauth"
import { RATE_LIMITS, getDayRange, getMonthRange, remainingDailyAllowance, remainingMonthlyAllowance } from "@/lib/rate-limits"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's Twitter credentials from the database
    const twitterOAuth = new TwitterOAuth()
    const tokens = await twitterOAuth.getValidTokens(user.id)

    if (!tokens) {
      return NextResponse.json({ error: "Twitter account not connected. Please connect your Twitter account first." }, { status: 400 })
    }

    const body = await request.json()
    const { tweetId, content, isThread, threadTweets, images } = body

    if (!tweetId) {
      return NextResponse.json({ error: "Tweet ID is required" }, { status: 400 })
    }

    // Enforce daily/monthly caps before immediate post
    const now = new Date()
    const { start: todayStart, end: todayEnd } = getDayRange(now)
    const { start: monthStart, end: monthEnd } = getMonthRange(now)

    const { count: todayPosted } = await supabase
      .from("tweets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "posted")
      .gte("posted_at", todayStart)
      .lte("posted_at", todayEnd)

    const { count: todayScheduled } = await supabase
      .from("tweets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .gte("scheduled_for", todayStart)
      .lte("scheduled_for", todayEnd)

    const { count: monthPosted } = await supabase
      .from("tweets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "posted")
      .gte("posted_at", monthStart)
      .lte("posted_at", monthEnd)

    const { count: monthScheduled } = await supabase
      .from("tweets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .gte("scheduled_for", monthStart)
      .lte("scheduled_for", monthEnd)

    const todayTotal = (todayScheduled || 0) + (todayPosted || 0)
    const monthTotal = (monthScheduled || 0) + (monthPosted || 0)

    const dailyRemaining = remainingDailyAllowance(todayTotal)
    const monthlyRemaining = remainingMonthlyAllowance(monthTotal)

    // If posting a thread immediately, require allowance to cover full thread
    const threadLength = isThread && Array.isArray(threadTweets)
      ? threadTweets.filter((t: string) => t && t.trim()).length
      : 0

    if (threadLength > 1) {
      if (dailyRemaining < threadLength) {
        return NextResponse.json(
          { error: `Daily limit insufficient for thread of ${threadLength}. Remaining: ${dailyRemaining}/${RATE_LIMITS.DAILY_TWEETS_MAX}.` },
          { status: 429 },
        )
      }
      if (monthlyRemaining < threadLength) {
        return NextResponse.json(
          { error: `Monthly limit insufficient for thread of ${threadLength}. Remaining: ${monthlyRemaining}/${RATE_LIMITS.MONTHLY_TWEETS_MAX}.` },
          { status: 429 },
        )
      }
    } else {
      if (dailyRemaining <= 0) {
        return NextResponse.json({ error: `Daily limit reached (${RATE_LIMITS.DAILY_TWEETS_MAX}/day).` }, { status: 429 })
      }
      if (monthlyRemaining <= 0) {
        return NextResponse.json({ error: `Monthly limit reached (${RATE_LIMITS.MONTHLY_TWEETS_MAX}/month).` }, { status: 429 })
      }
    }

    // Create Twitter client using stored tokens
    const twitterClient = await createTwitterClient({
      accessToken: tokens.access_token,
    })

    let twitterResponse

    if (isThread && threadTweets && threadTweets.length > 1) {
      // Post thread
      const validThreadTweets = threadTweets.filter((tweet: string) => tweet.trim())
      twitterResponse = await twitterClient.postThread(validThreadTweets, images)
    } else {
      // Post single tweet
      twitterResponse = await twitterClient.postTweet(content, images)
    }

    // Update tweet in database with Twitter ID and posted status
    const { error: updateError } = await supabase
      .from("tweets")
      .update({
        status: "posted",
        twitter_id: Array.isArray(twitterResponse) ? twitterResponse[0].id : twitterResponse.id,
        posted_at: new Date().toISOString(),
      })
      .eq("id", tweetId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Error updating tweet status:", updateError)
      return NextResponse.json({ error: "Failed to update tweet status" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      twitterId: Array.isArray(twitterResponse) ? twitterResponse[0].id : twitterResponse.id,
      message: "Tweet posted successfully to Twitter",
    })
  } catch (error) {
    console.error("Error posting tweet to Twitter:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to post tweet" },
      { status: 500 }
    )
  }
}
