export interface Tweet {
  id: string
  content: string
  scheduledDate: Date
  status: "scheduled" | "published" | "draft"
  createdAt: Date
  isThread?: boolean
  threadTweets?: string[]
}

export interface DatabaseTweet {
  id: string
  content: string
  scheduled_for: string | null
  status: "scheduled" | "posted" | "draft"
  created_at: string
  thread_id: string | null
  thread_tweets: string[] | null
  user_id: string
}

export interface TweetInput {
  content: string
  scheduledDate?: Date
  status: "scheduled" | "published" | "draft"
  isThread?: boolean
  threadTweets?: string[]
}
