import { createClient } from "@/lib/supabase/server"
import { createTwitterClient } from "@/lib/twitter"
import { TwitterOAuth } from "@/lib/twitter-oauth"
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
    const { tweetId, content, isThread, threadTweets } = body

    if (!tweetId) {
      return NextResponse.json({ error: "Tweet ID is required" }, { status: 400 })
    }

    // Create Twitter client using stored tokens
    const twitterClient = await createTwitterClient({
      accessToken: tokens.access_token,
    })

    let twitterResponse

    if (isThread && threadTweets && threadTweets.length > 1) {
      // Post thread
      const validThreadTweets = threadTweets.filter((tweet: string) => tweet.trim())
      twitterResponse = await twitterClient.postThread(validThreadTweets)
    } else {
      // Post single tweet
      twitterResponse = await twitterClient.postTweet(content)
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
