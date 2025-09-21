import { NextRequest, NextResponse } from 'next/server'
import { TwitterOAuth } from '@/lib/twitter-oauth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const twitterOAuth = new TwitterOAuth()
    const state = crypto.randomUUID() // Generate a random state
    
    // Store state in session or database for verification
    // For now, we'll skip this for simplicity
    
    const authUrl = twitterOAuth.getAuthorizationUrl(state)

    return NextResponse.json({ authUrl })

  } catch (error) {
    console.error('Twitter OAuth initiation error:', error)
    return NextResponse.json({ error: 'Failed to initiate Twitter OAuth' }, { status: 500 })
  }
}
