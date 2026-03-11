"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Twitter } from "lucide-react"

export default function Page() {
  const [error, setError] = useState<string | null>(null)
  const [isTwitterLoading, setIsTwitterLoading] = useState(false)

  const handleTwitterLogin = async () => {
    setIsTwitterLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", { method: "POST" })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate login")
      }

      window.location.href = data.url
    } catch (error: unknown) {
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
