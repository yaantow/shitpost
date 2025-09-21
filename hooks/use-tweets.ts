"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Tweet } from "@/types/tweet"

export function useTweets() {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTweets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/tweets")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tweets")
      }

      // Transform database tweets to frontend format
      const transformedTweets = (data.tweets || []).map((tweet: any) => ({
        id: tweet.id,
        content: tweet.content,
        scheduledDate: new Date(tweet.scheduled_for || tweet.created_at),
        status: tweet.status === "posted" ? ("published" as const) : (tweet.status as "scheduled" | "draft"),
        createdAt: new Date(tweet.created_at),
        isThread: tweet.thread_id !== null,
        threadTweets: tweet.thread_id ? [tweet.content] : undefined,
      }))

      setTweets(transformedTweets)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const addTweet = async (tweetData: {
    content: string
    scheduled_for?: string
    status?: "draft" | "scheduled" | "posted"
    thread_tweets?: string[]
  }) => {
    try {
      const response = await fetch("/api/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tweetData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create tweet")
      }

      // Refresh tweets list to get the updated data
      await fetchTweets()
      return data.tweet || data.tweets
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      throw err
    }
  }

  const updateTweet = async (
    id: string,
    updates: {
      content?: string
      scheduled_for?: string
      status?: "draft" | "scheduled" | "posted"
    },
  ) => {
    try {
      const response = await fetch(`/api/tweets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update tweet")
      }

      // Update local state
      setTweets((prev) => prev.map((tweet) => (tweet.id === id ? { ...tweet, ...data.tweet } : tweet)))

      return data.tweet
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      throw err
    }
  }

  const deleteTweet = async (id: string) => {
    try {
      const response = await fetch(`/api/tweets/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete tweet")
      }

      // Update local state
      setTweets((prev) => prev.filter((tweet) => tweet.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      throw err
    }
  }

  useEffect(() => {
    fetchTweets()
  }, [])

  return {
    tweets,
    isLoading,
    error,
    addTweet,
    updateTweet,
    deleteTweet,
    refetch: fetchTweets,
  }
}
