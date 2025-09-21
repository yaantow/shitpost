import { createClient } from "@/lib/supabase/server"
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
    const { content, scheduled_for, status = "draft", thread_tweets } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
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
