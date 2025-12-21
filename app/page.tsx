"use client"

import { useState, useEffect } from "react"
import { Calendar, PlusCircle, List } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TweetComposer } from "@/components/tweet-composer"
import { CalendarView } from "@/components/calendar-view"
import { TweetManager } from "@/components/tweet-manager"
import { ProfileMenu } from "@/components/profile-menu"
import { createClient } from "@/lib/supabase/client"
import { useTweets } from "@/hooks/use-tweets"
import Link from "next/link"
import { toast } from "sonner"


export default function TweetScheduler() {
  const [activeTab, setActiveTab] = useState("compose")
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const supabase = createClient()

  const { tweets, isLoading: tweetsLoading, error, addTweet, updateTweet, deleteTweet } = useTweets()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        setShowLoginPrompt(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Tweets are already transformed in the useTweets hook
  const convertedTweets = tweets

  const requireAuth = (callback: Function) => {
    return (...args: any[]) => {
      if (!user) {
        setShowLoginPrompt(true)
        return
      }
      return callback(...args)
    }
  }

  const handleAddTweet = requireAuth(async (tweet: any) => {
    try {
      const tweetData = {
        content: tweet.content,
        scheduled_for: tweet.scheduledDate?.toISOString(),
        status: tweet.status === "published" ? ("posted" as const) : tweet.status,
        thread_tweets: tweet.isThread ? tweet.threadTweets : undefined,
        images: tweet.images || undefined,
      }

      const result = await addTweet(tweetData)

      // If this is a "Post Now" tweet (status: "posted"), post it to Twitter immediately
      if (tweet.status === "published") {
        try {
          toast.loading("Posting to Twitter...", { id: "posting-tweet" })

          const postResponse = await fetch("/api/tweets/post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tweetId: result.id || result.tweets?.[0]?.id,
              content: tweet.content,
              isThread: tweet.isThread,
              threadTweets: tweet.threadTweets,
              images: tweet.images,
            }),
          })

          const postData = await postResponse.json()

          if (!postResponse.ok) {
            throw new Error(postData.error || "Failed to post to Twitter")
          }

          toast.success("Tweet posted to Twitter successfully!", { id: "posting-tweet" })
          console.log("Tweet posted to Twitter successfully:", postData)
        } catch (twitterError) {
          console.error("Error posting to Twitter:", twitterError)
          toast.error(`Failed to post to Twitter: ${twitterError instanceof Error ? twitterError.message : "Unknown error"}`, { id: "posting-tweet" })
        }
      }
    } catch (error) {
      console.error("Error adding tweet:", error)
    }
  })

  const handleUpdateTweet = requireAuth(async (id: string, updates: any) => {
    try {
      const updateData: any = {}
      if (updates.content !== undefined) updateData.content = updates.content
      if (updates.scheduledDate !== undefined) updateData.scheduled_for = updates.scheduledDate.toISOString()
      if (updates.status !== undefined) updateData.status = updates.status === "published" ? "posted" : updates.status

      await updateTweet(id, updateData)
    } catch (error) {
      console.error("Error updating tweet:", error)
    }
  })

  const handleDeleteTweet = requireAuth(async (id: string) => {
    try {
      await deleteTweet(id)
    } catch (error) {
      console.error("Error deleting tweet:", error)
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background with reduced blur */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/background.png)",
          filter: "blur(20px) brightness(0.4)",
          transform: "scale(1.1)",
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen bg-background/70 backdrop-blur-sm">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">ShitPost</h1>
            </div>
            {user ? (
              <ProfileMenu />
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/auth/login">Sign In with Twitter</Link>
              </Button>
            )}
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-2">
              <TabsTrigger value="compose" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Scheduled
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose">
              <TweetComposer
                onAddTweet={handleAddTweet}
                onUpdateTweet={handleUpdateTweet}
                onDeleteTweet={handleDeleteTweet}
                tweets={user ? convertedTweets : []}
              />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarView
                tweets={user ? convertedTweets : []}
                onUpdateTweet={handleUpdateTweet}
                onAddTweet={handleAddTweet}
                onDeleteTweet={handleDeleteTweet}
              />
            </TabsContent>

            <TabsContent value="manage">
              <TweetManager
                tweets={user ? convertedTweets : []}
                onUpdateTweet={handleUpdateTweet}
                onDeleteTweet={handleDeleteTweet}
              />
            </TabsContent>
          </Tabs>

          {showLoginPrompt && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Sign In Required</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">You need to sign in to schedule and manage tweets.</p>
                  <div className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                      <Link href="/auth/login">Sign In with Twitter</Link>
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setShowLoginPrompt(false)}>
                      Continue Browsing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {tweetsLoading && user && (
            <div className="fixed bottom-4 right-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-3 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">Syncing tweets...</span>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-border/50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>&copy; 2024 ShitPost. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
