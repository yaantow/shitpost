import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) {
    // Return basic profile from auth metadata if no profile row exists
    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email || "",
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || "User",
        twitter_username: user.user_metadata?.user_name || user.user_metadata?.preferred_username,
      },
    })
  }

  return NextResponse.json({ profile })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const { display_name, twitter_username } = body

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name,
      twitter_username: twitter_username || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
