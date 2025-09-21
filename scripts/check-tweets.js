#!/usr/bin/env node

/**
 * Script to check tweets in the database
 */

const { createClient } = require('@supabase/supabase-js')

async function checkTweets() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('🔍 Checking tweets in database...\n')

    // Get all tweets
    const { data: tweets, error } = await supabase
      .from('tweets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    console.log(`Found ${tweets.length} tweets:\n`)

    tweets.forEach((tweet, index) => {
      console.log(`${index + 1}. Tweet ID: ${tweet.id}`)
      console.log(`   Content: ${tweet.content.substring(0, 50)}...`)
      console.log(`   Status: ${tweet.status}`)
      console.log(`   Scheduled for: ${tweet.scheduled_for}`)
      console.log(`   Created: ${tweet.created_at}`)
      if (tweet.posted_at) {
        console.log(`   Posted: ${tweet.posted_at}`)
      }
      if (tweet.twitter_id) {
        console.log(`   Twitter ID: ${tweet.twitter_id}`)
      }
      console.log('')
    })

    // Check specifically for scheduled tweets
    const { data: scheduledTweets, error: scheduledError } = await supabase
      .from('tweets')
      .select('*')
      .eq('status', 'scheduled')

    if (scheduledError) {
      console.error('Error fetching scheduled tweets:', scheduledError)
    } else {
      console.log(`\n📅 Scheduled tweets: ${scheduledTweets.length}`)
      scheduledTweets.forEach(tweet => {
        console.log(`   - ${tweet.id}: ${tweet.content.substring(0, 30)}... (${tweet.scheduled_for})`)
      })
    }

    // Check for failed tweets
    const { data: failedTweets, error: failedError } = await supabase
      .from('tweets')
      .select('*')
      .eq('status', 'failed')

    if (failedError) {
      console.error('Error fetching failed tweets:', failedError)
    } else {
      console.log(`\n❌ Failed tweets: ${failedTweets.length}`)
      failedTweets.forEach(tweet => {
        console.log(`   - ${tweet.id}: ${tweet.content.substring(0, 30)}... (${tweet.scheduled_for})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkTweets()
