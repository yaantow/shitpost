# Twitter API Setup Guide

## Prerequisites

1. **Twitter Developer Account**: You need a Twitter Developer account to get API credentials
2. **Twitter App**: Create a Twitter app in the Twitter Developer Portal

## Steps to Set Up Twitter API

### 1. Create a Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Sign in with your Twitter account
3. Create a new app or use an existing one
4. Go to your app's "Keys and tokens" section

### 2. Get API Credentials

You'll need these credentials:
- **Client ID** (for OAuth 2.0)
- **Client Secret** (for OAuth 2.0)

### 3. Configure Twitter App Settings

In your Twitter app settings:
1. **App Permissions**: Set to "Read and write" (or "Read, write, and Direct Messages" if you need DM access)
2. **Callback URLs**: Add your app's callback URL: `http://localhost:3000/auth/twitter/callback` (for development)
3. **Website URL**: Add your app's domain
4. **OAuth 2.0**: Enable OAuth 2.0 User Context

### 4. Set Up Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Twitter OAuth 2.0 Configuration
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
```

### 5. Update Database Schema

Run the database migration to add Twitter OAuth 2.0 fields:

```sql
-- Run this in your Supabase SQL editor
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS twitter_scope text,
ADD COLUMN IF NOT EXISTS twitter_expires_at timestamp with time zone;
```

**Note**: We use Twitter OAuth 2.0 User Context directly, not through Supabase's Twitter provider. This gives us the proper tokens needed for posting tweets.

## Testing the Setup

1. Start your development server: `npm run dev`
2. Sign in with Twitter
3. Try posting a tweet using the "Post Now" button
4. Check your Twitter account to see if the tweet was posted

## Troubleshooting

### Common Issues

1. **"Twitter account not connected" error**:
   - Make sure you've signed in with Twitter
   - Check that the Twitter tokens are being stored in the profiles table

2. **"Invalid Twitter credentials" error**:
   - Verify your API Key and Secret are correct
   - Make sure your Twitter app has the right permissions

3. **"Failed to post tweet" error**:
   - Check your Twitter app's permissions
   - Verify the callback URLs are set correctly
   - Check the browser console for detailed error messages

### Debug Steps

1. Check the browser console for error messages
2. Verify environment variables are loaded correctly
3. Check the Supabase profiles table to ensure Twitter tokens are stored
4. Test the Twitter API credentials manually if needed

## Next Steps

Once the "Post Now" functionality is working, you can implement:
1. Scheduled tweet posting (background jobs)
2. Tweet editing and deletion
3. Thread management
4. Analytics and insights
