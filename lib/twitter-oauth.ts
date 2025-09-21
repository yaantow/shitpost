import { createClient, createServiceClient } from '@/lib/supabase/server'

export interface TwitterTokens {
  access_token: string
  refresh_token: string
  expires_at: number
  scope: string
}

export class TwitterOAuth {
  private clientId: string
  private clientSecret: string
  private redirectUri: string

  constructor() {
    this.clientId = process.env.TWITTER_CLIENT_ID!
    this.clientSecret = process.env.TWITTER_CLIENT_SECRET!
    this.redirectUri = `${process.env.NEXTAUTH_URL}/auth/twitter/callback`
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: 'challenge', // For PKCE
      code_challenge_method: 'plain'
    })

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`
  }

  async exchangeCodeForTokens(code: string): Promise<TwitterTokens> {
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        code_verifier: 'challenge' // For PKCE
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange code for tokens: ${error}`)
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      scope: data.scope
    }
  }

  async refreshTokens(refreshToken: string): Promise<TwitterTokens> {
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: this.clientId
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to refresh tokens: ${error}`)
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at: Date.now() + (data.expires_in * 1000),
      scope: data.scope
    }
  }

  async storeTokens(userId: string, tokens: TwitterTokens, supabaseClient?: any): Promise<void> {
    const supabase = supabaseClient || await createClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({
        twitter_access_token: tokens.access_token,
        twitter_refresh_token: tokens.refresh_token,
        twitter_expires_at: new Date(tokens.expires_at).toISOString(),
        twitter_scope: tokens.scope
      })
      .eq('id', userId)

    if (error) {
      throw new Error(`Failed to store Twitter tokens: ${error.message}`)
    }
  }

  async getValidTokens(userId: string, supabaseClient?: any): Promise<TwitterTokens | null> {
    const supabase = supabaseClient || await createClient()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('twitter_access_token, twitter_refresh_token, twitter_expires_at, twitter_scope')
      .eq('id', userId)
      .single()

    if (error || !profile?.twitter_access_token) {
      return null
    }

    const tokens: TwitterTokens = {
      access_token: profile.twitter_access_token,
      refresh_token: profile.twitter_refresh_token || '',
      expires_at: new Date(profile.twitter_expires_at || 0).getTime(),
      scope: profile.twitter_scope || ''
    }

    // Check if token is expired and refresh if needed
    if (tokens.expires_at <= Date.now() + 60000) { // Refresh if expires in 1 minute
      try {
        const newTokens = await this.refreshTokens(tokens.refresh_token)
        await this.storeTokens(userId, newTokens, supabaseClient)
        return newTokens
      } catch (error) {
        console.error('Failed to refresh Twitter tokens:', error)
        return null
      }
    }

    return tokens
  }
}
