"use client"

import { useMemo } from "react"
import { Calendar, Clock, BarChart3, TrendingUp, FileText, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Tweet } from "@/app/page"

interface DashboardProps {
  tweets: Tweet[]
}

export function Dashboard({ tweets }: DashboardProps) {
  const stats = useMemo(() => {
    const now = new Date()
    const scheduled = tweets.filter((t) => t.status === "scheduled" && t.scheduledDate > now)
    const drafts = tweets.filter((t) => t.status === "draft")
    const published = tweets.filter((t) => t.status === "published")
    const today = tweets.filter((t) => {
      const tweetDate = new Date(t.scheduledDate)
      return tweetDate.toDateString() === now.toDateString()
    })
    const thisWeek = tweets.filter((t) => {
      const tweetDate = new Date(t.scheduledDate)
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return tweetDate >= weekStart && tweetDate <= weekEnd
    })

    return {
      total: tweets.length,
      scheduled: scheduled.length,
      drafts: drafts.length,
      published: published.length,
      today: today.length,
      thisWeek: thisWeek.length,
    }
  }, [tweets])

  const upcomingTweets = useMemo(() => {
    const now = new Date()
    return tweets
      .filter((t) => t.status === "scheduled" && t.scheduledDate > now)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
      .slice(0, 5)
  }, [tweets])

  const recentActivity = useMemo(() => {
    return tweets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5)
  }, [tweets])

  const getStatusColor = (status: Tweet["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-primary/10 text-primary"
      case "published":
        return "bg-green-500/10 text-green-500"
      case "draft":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `in ${days} day${days > 1 ? "s" : ""}`
    if (hours > 0) return `in ${hours} hour${hours > 1 ? "s" : ""}`
    if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? "s" : ""}`
    return "soon"
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tweets</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-primary">{stats.scheduled}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.drafts}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-green-500">{stats.published}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            This Week's Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Weekly Goal Progress</span>
              <span className="text-sm font-medium">{stats.thisWeek}/7 tweets</span>
            </div>
            <Progress value={(stats.thisWeek / 7) * 100} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Today: </span>
                <span className="font-medium">{stats.today} tweets</span>
              </div>
              <div>
                <span className="text-muted-foreground">This Week: </span>
                <span className="font-medium">{stats.thisWeek} tweets</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tweets */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Tweets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTweets.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No upcoming tweets scheduled</p>
            ) : (
              <div className="space-y-4">
                {upcomingTweets.map((tweet) => (
                  <div key={tweet.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tweet.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={getStatusColor(tweet.status)}>
                          {tweet.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(tweet.scheduledDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((tweet) => (
                  <div key={tweet.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tweet.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={getStatusColor(tweet.status)}>
                          {tweet.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Created {tweet.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {stats.total === 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="max-w-md mx-auto">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Welcome to Tweet Scheduler</h3>
              <p className="text-muted-foreground mb-4">
                Get started by composing your first tweet. You can schedule it for later or save it as a draft.
              </p>
              <p className="text-sm text-muted-foreground">
                Use the "Compose" tab to create your first tweet and start building your content calendar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
