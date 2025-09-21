"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()

      try {
        console.log("[v0] Processing auth callback")

        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("[v0] Auth callback error:", error)
          router.push("/auth/error")
          return
        }

        if (data.session) {
          console.log("[v0] Session found:", data.session.user.id)

          // Check if profile exists, create if not
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.session.user.id)
            .single()

          if (profileError && profileError.code === "PGRST116") {
            // Profile doesn't exist, create it
            console.log("[v0] Creating new profile")
            const { error: insertError } = await supabase.from("profiles").insert({
              id: data.session.user.id,
              email: data.session.user.email || "",
              display_name:
                data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || "User",
              twitter_username:
                data.session.user.user_metadata?.user_name || data.session.user.user_metadata?.preferred_username,
            })

            if (insertError) {
              console.error("[v0] Error creating profile:", insertError)
            } else {
              console.log("[v0] Profile created successfully")
            }
          } else if (profile) {
            console.log("[v0] Profile exists:", profile.id)
          }

          // Successfully authenticated, redirect to main app
          router.push("/")
        } else {
          console.log("[v0] No session found, redirecting to login")
          // No session, redirect to login
          router.push("/auth/login")
        }
      } catch (error) {
        console.error("[v0] Unexpected error:", error)
        router.push("/auth/error")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}
