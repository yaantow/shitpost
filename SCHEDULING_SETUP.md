# Tweet Scheduling Setup

This document explains how to set up the tweet scheduling functionality.

## Overview

The scheduling system allows users to schedule tweets for future posting. The system includes:

1. **Frontend UI**: Users can select dates and times to schedule tweets
2. **Database Storage**: Scheduled tweets are stored in the database with their scheduled time
3. **Background Processing**: A cron job processes scheduled tweets and posts them to Twitter

## Components

### 1. Frontend Components

- **TweetComposer**: Main component with scheduling UI
- **Calendar View**: Shows scheduled tweets on a calendar
- **Quick Schedule**: Pre-defined time slots for easy scheduling

### 2. API Endpoints

- `POST /api/tweets` - Create new tweets (including scheduled ones)
- `POST /api/tweets/post` - Post tweets immediately to Twitter
- `GET /api/cron/process-tweets` - Process scheduled tweets (cron endpoint)

### 3. Database Schema

The `tweets` table includes:
- `scheduled_for`: Timestamp when the tweet should be posted
- `status`: 'draft', 'scheduled', 'posted', or 'failed'
- `thread_id`: For thread tweets
- `twitter_id`: Twitter's ID after posting

## Setup Instructions

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# Optional: Secret for cron endpoint security
CRON_SECRET=your-secret-key-here
```

### 2. Vercel Deployment (Recommended)

If deploying to Vercel, the cron job is automatically configured via `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-tweets",
      "schedule": "* * * * *"
    }
  ]
}
```

This runs every minute to check for scheduled tweets.

### 3. Manual Cron Setup

If not using Vercel, set up a cron job on your server:

```bash
# Add to crontab (runs every minute)
* * * * * cd /path/to/your/project && npm run process-scheduled
```

Or use the Node.js script directly:

```bash
# Run manually
node scripts/process-scheduled-tweets.js
```

### 4. External Cron Services

You can also use external services like:

- **GitHub Actions**: Set up a workflow that calls your cron endpoint
- **Cron-job.org**: Free service to ping your endpoint
- **Uptime Robot**: Monitor and ping your endpoint

Example GitHub Actions workflow:

```yaml
name: Process Scheduled Tweets
on:
  schedule:
    - cron: '* * * * *'  # Every minute
  workflow_dispatch:

jobs:
  process-tweets:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cron Endpoint
        run: |
          curl -X GET "https://your-domain.com/api/cron/process-tweets" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## How It Works

1. **Scheduling**: Users select a date and time in the UI
2. **Storage**: Tweet is saved with `status: 'scheduled'` and `scheduled_for` timestamp
3. **Processing**: Cron job runs every minute and checks for tweets where `scheduled_for <= now()`
4. **Rate Limiting**: System processes max 10 tweets per run with 2-second delays between tweets
5. **Posting**: Valid tweets are posted to Twitter and status updated to `'posted'`
6. **Error Handling**: Failed tweets are marked as `'failed'` with error details
7. **Rate Limit Protection**: If rate limits are hit, processing stops to avoid further violations

## Thread Support

The system supports Twitter threads:

1. When creating a thread, all tweets get the same `thread_id`
2. The first tweet has `thread_id: null` but gets updated after creation
3. When processing, all tweets in a thread are posted together
4. All tweets in the thread get updated with their Twitter IDs

## Monitoring

Check the logs for:
- Successful tweet postings
- Failed tweets and error messages
- Processing statistics

The cron endpoint returns JSON with processing results:

```json
{
  "message": "Processed 3 scheduled tweets",
  "processed": 3,
  "successful": 2,
  "failed": 1,
  "errors": ["Tweet abc123: No valid Twitter tokens"]
}
```

## Troubleshooting

### Common Issues

1. **Tweets not posting**: Check if cron job is running and Twitter tokens are valid
2. **Authentication errors**: Ensure Twitter OAuth is properly configured
3. **Database errors**: Check Supabase connection and permissions

### Debug Mode

To test the scheduling system:

1. Schedule a tweet for 1-2 minutes in the future
2. Wait and check if it gets posted
3. Check the cron endpoint response for any errors

### Manual Processing

You can manually trigger tweet processing by calling:

```bash
curl -X GET "https://your-domain.com/api/cron/process-tweets"
```

## Rate Limiting

The system includes comprehensive rate limiting to prevent hitting Twitter's API limits:

### Rate Limiting Strategy

- **Max tweets per run**: 10 tweets (configurable in `lib/rate-limits.ts`)
- **Delay between tweets**: 2 seconds (30 tweets per minute max)
- **Processing order**: Chronological (oldest tweets first)
- **Rate limit detection**: Automatically detects and stops on rate limit errors
- **Graceful degradation**: Remaining tweets are processed in the next run

### Twitter API Limits

- **Tweet posting**: 300 tweets per 15-minute window per user
- **Our rate**: ~30 tweets per minute = 450 tweets per 15 minutes (well within limits)
- **Safety margin**: We use only 60% of Twitter's limit to ensure reliability

### Configuration

Rate limiting settings can be adjusted in `lib/rate-limits.ts`:

```typescript
export const RATE_LIMITS = {
  MAX_TWEETS_PER_RUN: 10,        // Tweets per cron run
  DELAY_BETWEEN_TWEETS: 2000,    // Milliseconds between tweets
  MAX_TWEETS_PER_MINUTE: 30,     // Calculated from delay
  // ... more settings
}
```

### Error Handling

- **Rate limit errors**: Automatically detected and processing stops
- **Failed tweets**: Marked as 'failed' and logged with error details
- **Retry logic**: Failed tweets can be manually reset to 'scheduled' status
- **Monitoring**: All processing results are logged and returned in API responses

## Security

- The cron endpoint can be protected with a secret token
- All database operations use Row Level Security (RLS)
- Twitter tokens are encrypted and stored securely
