"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Tweet } from "@/lib/types"

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

      setTweets(data.tweets || [])
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

      // Refresh tweets list
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
