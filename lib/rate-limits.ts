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
  
  // Twitter posting caps (product-level limits)
  DAILY_TWEETS_MAX: 17, // Max posts per day per user
  MONTHLY_TWEETS_MAX: 500, // Max posts per month per user
  
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

/**
 * Get start/end ISO strings for a given day in the user's timezone (UTC by default)
 */
export function getDayRange(date: Date = new Date()): { start: string; end: string } {
  const startDate = new Date(date)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(date)
  endDate.setHours(23, 59, 59, 999)
  return { start: startDate.toISOString(), end: endDate.toISOString() }
}

/**
 * Get start/end ISO strings for the current calendar month
 */
export function getMonthRange(date: Date = new Date()): { start: string; end: string } {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start: startDate.toISOString(), end: endDate.toISOString() }
}

export function remainingDailyAllowance(alreadyCounted: number): number {
  return Math.max(0, RATE_LIMITS.DAILY_TWEETS_MAX - alreadyCounted)
}

export function remainingMonthlyAllowance(alreadyCounted: number): number {
  return Math.max(0, RATE_LIMITS.MONTHLY_TWEETS_MAX - alreadyCounted)
}

