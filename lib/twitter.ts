import { TwitterApi } from 'twitter-api-v2'
import type { TweetImage } from '@/types/tweet'

export interface TwitterCredentials {
  accessToken: string
}

export class TwitterClient {
  private client: TwitterApi

  constructor(credentials: TwitterCredentials) {
    // Use OAuth 2.0 User Context authentication
    this.client = new TwitterApi(credentials.accessToken)
  }

  async postTweet(text: string, images?: TweetImage[]): Promise<{ id: string; text: string }> {
    try {
      let mediaIds: string[] = []
      
      if (images && images.length > 0) {
        // Upload images to Twitter and get media IDs
        mediaIds = await this.uploadImages(images)
      }

      const tweetData: any = { text }
      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds }
      }

      const tweet = await this.client.v2.tweet(tweetData)
      return {
        id: tweet.data.id,
        text: tweet.data.text,
      }
    } catch (error) {
      console.error('Error posting tweet:', error)
      throw new Error('Failed to post tweet to Twitter')
    }
  }

  async postThread(tweets: string[], images?: TweetImage[]): Promise<{ id: string; text: string }[]> {
    try {
      const results = []
      let replyToId: string | undefined
      let mediaIds: string[] = []

      // Upload images for the first tweet only (Twitter limitation)
      if (images && images.length > 0) {
        mediaIds = await this.uploadImages(images)
      }

      for (let i = 0; i < tweets.length; i++) {
        const tweetData: any = { text: tweets[i] }
        
        if (replyToId) {
          tweetData.reply = { in_reply_to_tweet_id: replyToId }
        }

        // Only attach images to the first tweet
        if (i === 0 && mediaIds.length > 0) {
          tweetData.media = { media_ids: mediaIds }
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

  private async uploadImages(images: TweetImage[]): Promise<string[]> {
    try {
      const mediaIds: string[] = []
      
      for (const image of images) {
        // Fetch the image from S3 URL
        const response = await fetch(image.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch image from ${image.url}`)
        }
        
        const imageBuffer = await response.arrayBuffer()
        const imageData = Buffer.from(imageBuffer)
        
        // Upload to Twitter using v1.1 media upload endpoint
        const uploadResponse = await this.client.v1.uploadMedia(imageData, {
          mimeType: this.getMimeTypeFromUrl(image.url),
          additionalOwners: undefined,
        })
        
        // The response should have a media_id_string property
        const mediaId = (uploadResponse as any).media_id_string || uploadResponse
        mediaIds.push(mediaId)
      }
      
      return mediaIds
    } catch (error) {
      console.error('Error uploading images to Twitter:', error)
      throw new Error('Failed to upload images to Twitter')
    }
  }

  private getMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'gif':
        return 'image/gif'
      case 'webp':
        return 'image/webp'
      default:
        return 'image/jpeg' // Default fallback
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
