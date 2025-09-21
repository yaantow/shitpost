import { createServiceClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Get all tweets
    const { data: tweets, error } = await supabase
      .from("tweets")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      tweets,
      counts: {
        total: tweets.length,
        scheduled: tweets.filter(t => t.status === 'scheduled').length,
        posted: tweets.filter(t => t.status === 'posted').length,
        failed: tweets.filter(t => t.status === 'failed').length,
        draft: tweets.filter(t => t.status === 'draft').length,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tweets" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { action, tweetId } = body

    if (action === 'reset-failed') {
      // Reset failed tweets back to scheduled
      const { data, error } = await supabase
        .from("tweets")
        .update({ status: "scheduled" })
        .eq("status", "failed")
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ 
        message: `Reset ${data.length} failed tweets to scheduled`,
        tweets: data
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    )
  }
}
