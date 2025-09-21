/**
 * Rate limiting configuration for Twitter API
 */

export const RATE_LIMITS = {
  // Maximum tweets to process per cron run
  MAX_TWEETS_PER_RUN: 10,
  
  // Delay between tweets in milliseconds
  DELAY_BETWEEN_TWEETS: 2000, // 2 seconds
  
  // Maximum tweets per minute (calculated from delay)
  MAX_TWEETS_PER_MINUTE: 30, // 60 seconds / 2 seconds = 30 tweets
  
  // Maximum tweets per 15 minutes (Twitter's limit is 300)
  MAX_TWEETS_PER_15_MINUTES: 450, // 30 tweets/min * 15 min = 450 (well within 300 limit)
  
  // Error messages that indicate rate limiting
  RATE_LIMIT_ERRORS: [
    'rate limit',
    '429',
    'Too Many Requests',
    'Rate limit exceeded',
    'Request limit exceeded'
  ]
} as const

/**
 * Check if an error message indicates a rate limit error
 */
export function isRateLimitError(errorMessage: string): boolean {
  return RATE_LIMITS.RATE_LIMIT_ERRORS.some(error => 
    errorMessage.toLowerCase().includes(error.toLowerCase())
  )
}

/**
 * Calculate delay for processing multiple tweets
 */
export function calculateDelay(tweetIndex: number): number {
  return tweetIndex > 0 ? RATE_LIMITS.DELAY_BETWEEN_TWEETS : 0
}

