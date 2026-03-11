import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Check if profile exists, create if not
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.session.user.id)
        .single()

      if (profileError && profileError.code === "PGRST116") {
        await supabase.from("profiles").insert({
          id: data.session.user.id,
          email: data.session.user.email || "",
          display_name:
            data.session.user.user_metadata?.full_name ||
            data.session.user.user_metadata?.name ||
            "User",
          twitter_username:
            data.session.user.user_metadata?.user_name ||
            data.session.user.user_metadata?.preferred_username,
        })
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
