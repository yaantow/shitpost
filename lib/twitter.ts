import { TwitterApi } from 'twitter-api-v2'
import type { TweetImage } from '@/types/tweet'

export interface TwitterCredentials {
  accessToken: string
  accessTokenSecret?: string // For OAuth 1.0a media uploads
}

export class TwitterClient {
  private client: TwitterApi
  private mediaClient?: TwitterApi // OAuth 1.0a client for media uploads

  constructor(credentials: TwitterCredentials) {
    // If OAuth 1.0a credentials are provided, use them for BOTH v1.1 media and v2 tweets
    if (credentials.accessTokenSecret) {
      const appKey = process.env.TWITTER_API_KEY!
      const appSecret = process.env.TWITTER_API_SECRET!
      this.mediaClient = new TwitterApi({
        appKey,
        appSecret,
        accessToken: credentials.accessToken,
        accessSecret: credentials.accessTokenSecret,
      })
      // Use the same OAuth 1.0a client for v2 posting as well
      this.client = this.mediaClient
    } else {
      // Fallback: OAuth 2.0 User Context (works for text tweets only)
      this.client = new TwitterApi(credentials.accessToken)
    }
  }

  async postTweet(text: string, images?: TweetImage[]): Promise<{ id: string; text: string }> {
    try {
      let mediaIds: string[] = []
      
      console.log('Twitter postTweet called with:', { text, images })
      console.log('Twitter client initialized:', !!this.client)
      
      if (images && images.length > 0) {
        console.log('Uploading images to Twitter...')
        // Upload images to Twitter and get media IDs
        mediaIds = await this.uploadImages(images)
        console.log('Media IDs received:', mediaIds)
      }

      const tweetData: any = { text }
      if (mediaIds.length > 0) {
        tweetData.media_ids = mediaIds
        console.log('Tweet data with media:', tweetData)
      } else {
        console.log('Tweet data without media:', tweetData)
      }

      console.log('About to call Twitter API v2.tweet with:', tweetData)
      const tweet = await this.client.v2.tweet(tweetData)
      console.log('Tweet posted successfully:', tweet)
      return {
        id: tweet.data.id,
        text: tweet.data.text,
      }
    } catch (error) {
      console.error('Error posting tweet:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      throw new Error(`Failed to post tweet to Twitter: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
          tweetData.media_ids = mediaIds
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
      
      console.log('Starting image upload process for:', images.length, 'images')
      
      for (const image of images) {
        console.log('Processing image:', image.url)
        
        // Validate image URL
        if (!image.url || !image.url.startsWith('http')) {
          throw new Error(`Invalid image URL: ${image.url}`)
        }
        
        // Fetch the image from S3 URL
        const response = await fetch(image.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch image from ${image.url}: ${response.status} ${response.statusText}`)
        }
        
        const imageBuffer = await response.arrayBuffer()
        const imageData = Buffer.from(imageBuffer)
        
        console.log('Image fetched, size:', imageData.length, 'bytes')
        
        // Validate image size (Twitter has limits)
        if (imageData.length === 0) {
          throw new Error('Image file is empty')
        }
        
        if (imageData.length > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('Image file too large (max 5MB)')
        }
        
        // Upload to Twitter using v1.1 media upload endpoint
        // Use OAuth 1.0a client for media uploads if available, otherwise fall back to OAuth 2.0
        const clientToUse = this.mediaClient || this.client
        console.log('Using client for media upload:', this.mediaClient ? 'OAuth 1.0a' : 'OAuth 2.0')
        
        const uploadResponse = await clientToUse.v1.uploadMedia(imageData, {
          mimeType: this.getMimeTypeFromUrl(image.url),
          additionalOwners: undefined,
        })
        
        console.log('Twitter upload response:', uploadResponse)
        
        // Extract media ID from response
        let mediaId: string
        if (typeof uploadResponse === 'string') {
          mediaId = uploadResponse
        } else if (uploadResponse && typeof uploadResponse === 'object' && 'media_id_string' in uploadResponse) {
          mediaId = (uploadResponse as any).media_id_string
        } else {
          throw new Error(`Unexpected upload response format: ${JSON.stringify(uploadResponse)}`)
        }
        
        if (!mediaId) {
          throw new Error('No media ID returned from Twitter upload')
        }
        
        mediaIds.push(mediaId)
        console.log('Media ID added:', mediaId)
      }
      
      console.log('All images uploaded, media IDs:', mediaIds)
      return mediaIds
    } catch (error) {
      console.error('Error uploading images to Twitter:', error)
      console.error('Image upload error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      throw new Error(`Failed to upload images to Twitter: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
