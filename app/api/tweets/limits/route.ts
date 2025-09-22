import { createClient } from "@/lib/supabase/server"
import { RATE_LIMITS, getDayRange, getMonthRange, remainingDailyAllowance, remainingMonthlyAllowance } from "@/lib/rate-limits"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic";

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

    const now = new Date()
    const { start: todayStart, end: todayEnd } = getDayRange(now)
    const { start: monthStart, end: monthEnd } = getMonthRange(now)

    // Today's scheduled (due today)
    const { count: todayScheduledCount } = await supabase
      .from("tweets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .gte("scheduled_for", todayStart)
      .lte("scheduled_for", todayEnd)

    // Today's posted
    const { count: todayPostedCount } = await supabase
      .from("tweets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "posted")
      .gte("posted_at", todayStart)
      .lte("posted_at", todayEnd)

    // Month scheduled (within current month)
    const { count: monthScheduledCount } = await supabase
      .from("tweets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .gte("scheduled_for", monthStart)
      .lte("scheduled_for", monthEnd)

    // Month posted
    const { count: monthPostedCount } = await supabase
      .from("tweets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "posted")
      .gte("posted_at", monthStart)
      .lte("posted_at", monthEnd)

    const todayTotalPlannedOrPosted = (todayScheduledCount || 0) + (todayPostedCount || 0)
    const monthTotalPlannedOrPosted = (monthScheduledCount || 0) + (monthPostedCount || 0)

    return NextResponse.json({
      limits: {
        dailyMax: RATE_LIMITS.DAILY_TWEETS_MAX,
        monthlyMax: RATE_LIMITS.MONTHLY_TWEETS_MAX,
      },
      today: {
        scheduled: todayScheduledCount || 0,
        posted: todayPostedCount || 0,
        remaining: remainingDailyAllowance(todayTotalPlannedOrPosted),
      },
      month: {
        scheduled: monthScheduledCount || 0,
        posted: monthPostedCount || 0,
        remaining: remainingMonthlyAllowance(monthTotalPlannedOrPosted),
      },
    })
  } catch (error) {
    console.error("Error fetching tweet limits:", error)
    return NextResponse.json({ error: "Failed to fetch limits" }, { status: 500 })
  }
}


