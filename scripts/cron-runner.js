#!/usr/bin/env node

/**
 * Self-hosted cron runner for scheduled tweets
 * Runs every minute and processes scheduled tweets
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function processScheduledTweets() {
  try {
    console.log(`[${new Date().toISOString()}] Processing scheduled tweets...`)
    
    const response = await fetch(`${BASE_URL}/api/cron/process-tweets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process scheduled tweets')
    }

    console.log(`[${new Date().toISOString()}] ${data.message}`)
    
    if (data.processed > 0) {
      console.log(`  - Processed: ${data.processed}`)
      console.log(`  - Successful: ${data.successful}`)
      console.log(`  - Failed: ${data.failed}`)
      
      if (data.errors && data.errors.length > 0) {
        console.log('  - Errors:')
        data.errors.forEach(error => console.log(`    - ${error}`))
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing scheduled tweets:`, error.message)
  }
}

// Run immediately
processScheduledTweets()

// Then run every minute
setInterval(processScheduledTweets, 60 * 1000) // 60 seconds

console.log('🕐 Cron runner started. Processing tweets every minute...')
console.log('Press Ctrl+C to stop.')

