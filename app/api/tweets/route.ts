import { createClient } from "@/lib/supabase/server"
import { RATE_LIMITS, getDayRange, getMonthRange, remainingDailyAllowance, remainingMonthlyAllowance } from "@/lib/rate-limits"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: tweets, error } = await supabase
      .from("tweets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tweets })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const body = await request.json()
    const { content, scheduled_for, status = "draft", thread_tweets, images } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Enforce daily/monthly caps on scheduling
    if (status === "scheduled") {
      const now = new Date()
      const { start: todayStart, end: todayEnd } = getDayRange(now)
      const { start: monthStart, end: monthEnd } = getMonthRange(now)

      const { count: todayScheduled } = await supabase
        .from("tweets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "scheduled")
        .gte("scheduled_for", todayStart)
        .lte("scheduled_for", todayEnd)

      const { count: todayPosted } = await supabase
        .from("tweets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "posted")
        .gte("posted_at", todayStart)
        .lte("posted_at", todayEnd)

      const { count: monthScheduled } = await supabase
        .from("tweets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "scheduled")
        .gte("scheduled_for", monthStart)
        .lte("scheduled_for", monthEnd)

      const { count: monthPosted } = await supabase
        .from("tweets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "posted")
        .gte("posted_at", monthStart)
        .lte("posted_at", monthEnd)

      const todayTotal = (todayScheduled || 0) + (todayPosted || 0)
      const monthTotal = (monthScheduled || 0) + (monthPosted || 0)

      // If scheduling a thread, require allowance to cover the entire thread length
      const threadLength = Array.isArray(thread_tweets)
        ? thread_tweets.filter((t: string) => t && t.trim()).length
        : 0

      const dailyRemaining = remainingDailyAllowance(todayTotal)
      const monthlyRemaining = remainingMonthlyAllowance(monthTotal)

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
    }

    // Handle thread tweets
    if (thread_tweets && Array.isArray(thread_tweets) && thread_tweets.length > 1) {
      const threadId = crypto.randomUUID()
      const tweets = []

      for (let i = 0; i < thread_tweets.length; i++) {
        const tweetContent = thread_tweets[i].trim()
        if (!tweetContent) continue

        const { data: tweet, error } = await supabase
          .from("tweets")
          .insert({
            user_id: user.id,
            content: tweetContent,
            thread_order: i + 1,
            thread_id: i === 0 ? null : threadId,
            scheduled_for,
            status,
            images: i === 0 ? (images || null) : null, // Only first tweet gets images
          })
          .select()
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        tweets.push(tweet)

        // Update the first tweet with the thread_id
        if (i === 0) {
          await supabase.from("tweets").update({ thread_id: threadId }).eq("id", tweet.id)
        }
      }

      return NextResponse.json({ tweets })
    } else {
      // Single tweet
      const { data: tweet, error } = await supabase
        .from("tweets")
        .insert({
          user_id: user.id,
          content: content.trim(),
          scheduled_for,
          status,
          images: images || null,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ tweet })
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
