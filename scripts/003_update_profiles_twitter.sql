-- Update profiles table to include Twitter OAuth 2.0 User Context tokens
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS twitter_scope text,
ADD COLUMN IF NOT EXISTS twitter_expires_at timestamp with time zone;

-- Update existing columns to be more descriptive
COMMENT ON COLUMN public.profiles.twitter_access_token IS 'Twitter OAuth 2.0 User Context access token';
COMMENT ON COLUMN public.profiles.twitter_refresh_token IS 'Twitter OAuth 2.0 User Context refresh token';
COMMENT ON COLUMN public.profiles.twitter_scope IS 'Twitter OAuth 2.0 scope (e.g., tweet.read tweet.write users.read offline.access)';
COMMENT ON COLUMN public.profiles.twitter_expires_at IS 'When the Twitter access token expires';
