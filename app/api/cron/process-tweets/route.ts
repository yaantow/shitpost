import { createServiceClient } from "@/lib/supabase/server"
import { createTwitterClient } from "@/lib/twitter"
import { TwitterOAuth } from "@/lib/twitter-oauth"
import { RATE_LIMITS, isRateLimitError, calculateDelay, getDayRange, getMonthRange, remainingDailyAllowance, remainingMonthlyAllowance } from "@/lib/rate-limits"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Cron endpoint to process scheduled tweets with rate limiting
 * 
 * Rate Limiting Strategy:
 * - Process max 10 tweets per run to prevent overwhelming the system
 * - 2-second delay between tweets (30 tweets per minute max)
 * - Stop processing if rate limit is hit
 * - Tweets are processed in chronological order (oldest first)
 * 
 * Twitter API Limits:
 * - Tweet posting: 300 tweets per 15-minute window per user
 * - Our rate: ~30 tweets per minute = 450 tweets per 15 minutes (well within limits)
 */

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request (optional security check)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()

    // Get all scheduled tweets that are due to be posted
    // Limit to 10 tweets per run to prevent overwhelming the system
    const now = new Date().toISOString()
    const { data: scheduledTweets, error: fetchError } = await supabase
      .from("tweets")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(RATE_LIMITS.MAX_TWEETS_PER_RUN)

    if (fetchError) {
      console.error("Error fetching scheduled tweets:", fetchError)
      return NextResponse.json({ error: "Failed to fetch scheduled tweets" }, { status: 500 })
    }

    if (!scheduledTweets || scheduledTweets.length === 0) {
      return NextResponse.json({ 
        message: "No scheduled tweets to process",
        processed: 0 
      })
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each scheduled tweet with rate limiting
    for (let i = 0; i < scheduledTweets.length; i++) {
      const tweet = scheduledTweets[i]
      
      try {
        results.processed++

        // Add delay between tweets to respect rate limits
        const delay = calculateDelay(i)
        if (delay > 0) {
          console.log(`Waiting ${delay/1000} seconds before processing next tweet...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        // Enforce daily/monthly caps per user before posting
        const now = new Date()
        const { start: todayStart, end: todayEnd } = getDayRange(now)
        const { start: monthStart, end: monthEnd } = getMonthRange(now)

        const { count: todayPosted } = await supabase
          .from("tweets")
          .select("id", { count: "exact", head: true })
          .eq("user_id", tweet.user_id)
          .eq("status", "posted")
          .gte("posted_at", todayStart)
          .lte("posted_at", todayEnd)

        const { count: todayScheduled } = await supabase
          .from("tweets")
          .select("id", { count: "exact", head: true })
          .eq("user_id", tweet.user_id)
          .eq("status", "scheduled")
          .gte("scheduled_for", todayStart)
          .lte("scheduled_for", todayEnd)

        const { count: monthPosted } = await supabase
          .from("tweets")
          .select("id", { count: "exact", head: true })
          .eq("user_id", tweet.user_id)
          .eq("status", "posted")
          .gte("posted_at", monthStart)
          .lte("posted_at", monthEnd)

        const { count: monthScheduled } = await supabase
          .from("tweets")
          .select("id", { count: "exact", head: true })
          .eq("user_id", tweet.user_id)
          .eq("status", "scheduled")
          .gte("scheduled_for", monthStart)
          .lte("scheduled_for", monthEnd)

        const todayTotal = (todayScheduled || 0) + (todayPosted || 0)
        const monthTotal = (monthScheduled || 0) + (monthPosted || 0)

        if (remainingDailyAllowance(todayTotal) <= 0) {
          await supabase.from("tweets").update({ status: "failed" }).eq("id", tweet.id)
          results.failed++
          results.errors.push(`Tweet ${tweet.id}: Daily limit reached (${RATE_LIMITS.DAILY_TWEETS_MAX}/day) for user ${tweet.user_id}`)
          continue
        }
        if (remainingMonthlyAllowance(monthTotal) <= 0) {
          await supabase.from("tweets").update({ status: "failed" }).eq("id", tweet.id)
          results.failed++
          results.errors.push(`Tweet ${tweet.id}: Monthly limit reached (${RATE_LIMITS.MONTHLY_TWEETS_MAX}/month) for user ${tweet.user_id}`)
          continue
        }

        // Get user's Twitter credentials
        const twitterOAuth = new TwitterOAuth()
        const tokens = await twitterOAuth.getValidTokens(tweet.user_id, supabase)

        if (!tokens) {
          // Mark tweet as failed if no valid tokens
          await supabase
            .from("tweets")
            .update({ status: "failed" })
            .eq("id", tweet.id)

          results.failed++
          results.errors.push(`Tweet ${tweet.id}: No valid Twitter tokens`)
          continue
        }

        // Create Twitter client
        const twitterClient = await createTwitterClient({
          accessToken: tokens.access_token,
        })

        let twitterResponse: any

        // Check if this is part of a thread
        if (tweet.thread_id) {
          // Get all tweets in the thread
          const { data: threadTweets, error: threadError } = await supabase
            .from("tweets")
            .select("*")
            .eq("thread_id", tweet.thread_id)
            .order("thread_order", { ascending: true })

          if (threadError || !threadTweets) {
            results.failed++
            results.errors.push(`Tweet ${tweet.id}: Failed to fetch thread tweets`)
            continue
          }

          // Validate remaining allowance can cover the entire thread
          const validThreadLength = threadTweets.filter(t => t.content && t.content.trim()).length
          const dailyRemaining = remainingDailyAllowance(todayTotal)
          const monthlyRemaining = remainingMonthlyAllowance(monthTotal)

          if (dailyRemaining < validThreadLength) {
            for (const t of threadTweets) {
              await supabase.from("tweets").update({ status: "failed" }).eq("id", t.id)
            }
            results.failed += threadTweets.length
            results.errors.push(`Thread ${tweet.thread_id}: Daily limit insufficient for ${validThreadLength} tweets. Remaining: ${dailyRemaining}/${RATE_LIMITS.DAILY_TWEETS_MAX}`)
            continue
          }
          if (monthlyRemaining < validThreadLength) {
            for (const t of threadTweets) {
              await supabase.from("tweets").update({ status: "failed" }).eq("id", t.id)
            }
            results.failed += threadTweets.length
            results.errors.push(`Thread ${tweet.thread_id}: Monthly limit insufficient for ${validThreadLength} tweets. Remaining: ${monthlyRemaining}/${RATE_LIMITS.MONTHLY_TWEETS_MAX}`)
            continue
          }

          // Post thread
          const threadContents = threadTweets.map(t => t.content)
          // Get images from the first tweet in the thread (Twitter limitation)
          const threadImages = threadTweets[0]?.images || null
          console.log(`Processing scheduled thread ${tweet.thread_id} with images:`, threadImages)
          try {
            twitterResponse = await twitterClient.postThread(threadContents, threadImages)
          } catch (error) {
            console.error(`Failed to post scheduled thread ${tweet.thread_id}:`, error)
            // Mark all tweets in the thread as failed
            for (const threadTweet of threadTweets) {
              await supabase
                .from("tweets")
                .update({ status: "failed" })
                .eq("id", threadTweet.id)
            }
            results.failed += threadTweets.length
            results.errors.push(`Thread ${tweet.thread_id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            continue
          }

          // Update all tweets in the thread
          const twitterIds = Array.isArray(twitterResponse) ? twitterResponse.map((t: any) => t.id) : [twitterResponse.id]
          for (let i = 0; i < threadTweets.length; i++) {
            await supabase
              .from("tweets")
              .update({
                status: "posted",
                twitter_id: twitterIds[i] || twitterIds[0],
                posted_at: new Date().toISOString(),
              })
              .eq("id", threadTweets[i].id)
          }
        } else {
          // Post single tweet
          console.log(`Processing scheduled tweet ${tweet.id} with images:`, tweet.images)
          try {
            twitterResponse = await twitterClient.postTweet(tweet.content, tweet.images)
          } catch (error) {
            console.error(`Failed to post scheduled tweet ${tweet.id}:`, error)
            await supabase
              .from("tweets")
              .update({ status: "failed" })
              .eq("id", tweet.id)
            results.failed++
            results.errors.push(`Tweet ${tweet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            continue
          }

          // Update tweet status
          await supabase
            .from("tweets")
            .update({
              status: "posted",
              twitter_id: twitterResponse.id,
              posted_at: new Date().toISOString(),
            })
            .eq("id", tweet.id)
        }

        results.successful++
        console.log(`Successfully posted tweet ${tweet.id} to Twitter`)

      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`Tweet ${tweet.id}: ${errorMessage}`)
        
        // Check if it's a rate limit error
        const isRateLimit = isRateLimitError(errorMessage)
        
        if (isRateLimit) {
          console.error(`Rate limit hit for tweet ${tweet.id}. Stopping processing to avoid further limits.`)
          results.errors.push(`Rate limit reached. Remaining tweets will be processed in the next run.`)
          break // Stop processing to avoid hitting rate limits further
        }
        
        // Mark tweet as failed
        await supabase
          .from("tweets")
          .update({ status: "failed" })
          .eq("id", tweet.id)

        console.error(`Error posting tweet ${tweet.id}:`, error)
      }
    }

    return NextResponse.json({
      message: `Processed ${results.processed} scheduled tweets`,
      ...results
    })

  } catch (error) {
    console.error("Error processing scheduled tweets:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process scheduled tweets" },
      { status: 500 }
    )
  }
}
