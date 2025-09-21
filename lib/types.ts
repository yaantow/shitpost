export interface Tweet {
  id: string
  user_id: string
  content: string
  thread_order: number
  thread_id?: string
  scheduled_for?: string
  posted_at?: string
  status: "draft" | "scheduled" | "posted" | "failed"
  twitter_id?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  display_name: string
  twitter_username?: string
  twitter_access_token?: string
  twitter_refresh_token?: string
  created_at: string
  updated_at: string
}
