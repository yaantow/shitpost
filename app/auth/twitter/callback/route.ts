import { NextRequest, NextResponse } from 'next/server'
import { TwitterOAuth } from '@/lib/twitter-oauth'
import { createClient } from '@/lib/supabase/server'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL }/auth/error?error=${error}`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL }/auth/error?error=no_code`)
    }

    // Verify state parameter (you should store this in session/database)
    // For now, we'll skip state verification for simplicity

    const twitterOAuth = new TwitterOAuth()
    const tokens = await twitterOAuth.exchangeCodeForTokens(code)

    // Get the current user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL }/auth/login`)
    }

    // Store the tokens
    await twitterOAuth.storeTokens(user.id, tokens)

    // Redirect back to the main app
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL }/?twitter_connected=true`)

  } catch (error) {
    console.error('Twitter OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL }/auth/error?error=callback_failed`)
  }
}
