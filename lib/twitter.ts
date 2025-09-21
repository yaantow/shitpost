import { TwitterApi } from 'twitter-api-v2'

export interface TwitterCredentials {
  accessToken: string
}

export class TwitterClient {
  private client: TwitterApi

  constructor(credentials: TwitterCredentials) {
    // Use OAuth 2.0 User Context authentication
    this.client = new TwitterApi(credentials.accessToken)
  }

  async postTweet(text: string): Promise<{ id: string; text: string }> {
    try {
      const tweet = await this.client.v2.tweet(text)
      return {
        id: tweet.data.id,
        text: tweet.data.text,
      }
    } catch (error) {
      console.error('Error posting tweet:', error)
      throw new Error('Failed to post tweet to Twitter')
    }
  }

  async postThread(tweets: string[]): Promise<{ id: string; text: string }[]> {
    try {
      const results = []
      let replyToId: string | undefined

      for (let i = 0; i < tweets.length; i++) {
        const tweetData: any = { text: tweets[i] }
        
        if (replyToId) {
          tweetData.reply = { in_reply_to_tweet_id: replyToId }
        }

        const tweet = await this.client.v2.tweet(tweetData)
        results.push({
          id: tweet.data.id,
          text: tweet.data.text,
        })
        
        replyToId = tweet.data.id
      }

      return results
    } catch (error) {
      console.error('Error posting thread:', error)
      throw new Error('Failed to post thread to Twitter')
    }
  }

  async verifyCredentials(): Promise<boolean> {
    try {
      const me = await this.client.v2.me()
      console.log('Twitter credentials verified successfully for user:', me.data.username)
      return true
    } catch (error) {
      console.error('Error verifying Twitter credentials:', error)
      return false
    }
  }
}

export async function createTwitterClient(credentials: TwitterCredentials): Promise<TwitterClient> {
  const client = new TwitterClient(credentials)
  
  // Skip credential verification for now since we're using Supabase tokens
  // The verification will happen when we try to post
  return client
}
