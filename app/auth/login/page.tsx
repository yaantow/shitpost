"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Twitter } from "lucide-react"

export default function Page() {
  const [error, setError] = useState<string | null>(null)
  const [isTwitterLoading, setIsTwitterLoading] = useState(false)
  const router = useRouter()

  const handleTwitterLogin = async () => {
    const supabase = createClient()
    setIsTwitterLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting Twitter OAuth flow")
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "twitter",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        console.log("[v0] Twitter OAuth error:", error)
        throw error
      }
      console.log("[v0] Twitter OAuth initiated successfully")
    } catch (error: unknown) {
      console.log("[v0] Twitter OAuth failed:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsTwitterLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign In with Twitter</CardTitle>
              <CardDescription>Connect your Twitter account to start scheduling tweets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <Button onClick={handleTwitterLogin} className="w-full" disabled={isTwitterLoading}>
                  <Twitter className="mr-2 h-4 w-4" />
                  {isTwitterLoading ? "Connecting..." : "Continue with Twitter"}
                </Button>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
