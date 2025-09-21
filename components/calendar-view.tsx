"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Calendar, Edit, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Tweet } from "@/app/page"

interface CalendarViewProps {
  tweets: Tweet[]
  onUpdateTweet: (id: string, updates: Partial<Tweet>) => void
  onAddTweet: (tweet: Omit<Tweet, "id" | "createdAt">) => void
  onDeleteTweet: (id: string) => void
}

export function CalendarView({ tweets, onUpdateTweet, onAddTweet, onDeleteTweet }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingTweet, setEditingTweet] = useState<Tweet | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [newTweetContent, setNewTweetContent] = useState("")
  const [newTweetTime, setNewTweetTime] = useState("09:00")

  const { calendarDays, monthName, year } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const monthName = currentDate.toLocaleString("default", { month: "long" })

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return { calendarDays: days, monthName, year }
  }, [currentDate])

  const tweetsByDate = useMemo(() => {
    const map = new Map<string, Tweet[]>()
    tweets.forEach((tweet) => {
      const dateKey = tweet.scheduledDate.toDateString()
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(tweet)
    })
    return map
  }, [tweets])

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
      return newDate
    })
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getDayTweets = (date: Date) => {
    return tweetsByDate.get(date.toDateString()) || []
  }

  const getStatusColor = (status: Tweet["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-primary/10 text-primary border-primary/20"
      case "published":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "draft":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const handleEditTweet = (tweet: Tweet) => {
    setEditingTweet(tweet)
    setEditContent(tweet.content)
    const date = new Date(tweet.scheduledDate)
    setEditDate(date.toISOString().split("T")[0])
    setEditTime(date.toTimeString().slice(0, 5))
  }

  const handleSaveEdit = () => {
    if (!editingTweet) return

    const newDateTime = new Date(`${editDate}T${editTime}`)
    onUpdateTweet(editingTweet.id, {
      content: editContent,
      scheduledDate: newDateTime,
    })

    setEditingTweet(null)
    setEditContent("")
    setEditDate("")
    setEditTime("")
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setNewTweetTime("09:00")
    setNewTweetContent("")
  }

  const handleAddTweetFromCalendar = () => {
    if (!selectedDate || !newTweetContent.trim()) return

    const [hours, minutes] = newTweetTime.split(":").map(Number)
    const scheduledDate = new Date(selectedDate)
    scheduledDate.setHours(hours, minutes, 0, 0)

    if (scheduledDate <= new Date()) {
      alert("Please select a future date and time")
      return
    }

    onAddTweet({
      content: newTweetContent.trim(),
      scheduledDate,
      status: "scheduled",
    })

    setNewTweetContent("")
    setSelectedDate(null)
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {monthName} {year}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs">
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const dayTweets = getDayTweets(date)
              const isCurrentMonthDay = isCurrentMonth(date)
              const isTodayDate = isToday(date)

              return (
                <div
                  key={index}
                  className={`
                    min-h-[100px] p-2 border rounded-lg transition-colors cursor-pointer
                    ${isCurrentMonthDay ? "bg-card border-border hover:bg-muted/50" : "bg-muted/20 border-muted"}
                    ${isTodayDate ? "ring-2 ring-primary/50" : ""}
                  `}
                  onClick={() => handleDayClick(date)}
                >
                  <div
                    className={`
                    text-sm font-medium mb-2
                    ${isCurrentMonthDay ? "text-foreground" : "text-muted-foreground"}
                    ${isTodayDate ? "text-primary" : ""}
                  `}
                  >
                    {date.getDate()}
                  </div>

                  <div className="space-y-1">
                    {dayTweets.slice(0, 2).map((tweet) => (
                      <div
                        key={tweet.id}
                        className={`
                          text-xs p-1 rounded cursor-pointer truncate border
                          ${getStatusColor(tweet.status)}
                          hover:opacity-80 transition-opacity
                        `}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditTweet(tweet)
                        }}
                      >
                        {tweet.content.slice(0, 20)}...
                      </div>
                    ))}

                    {dayTweets.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center py-1 cursor-pointer hover:text-primary">
                        +{dayTweets.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing tweets for this day */}
            {selectedDate && getDayTweets(selectedDate).length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Scheduled Tweets ({getDayTweets(selectedDate).length})</h4>
                {getDayTweets(selectedDate).map((tweet) => (
                  <div key={tweet.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{tweet.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getStatusColor(tweet.status)}`}>{tweet.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {tweet.scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditTweet(tweet)} className="h-8 w-8 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTweet(tweet.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new tweet section */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-4 w-4 text-blue-400" />
                <h4 className="font-medium text-sm">Schedule New Tweet</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="new-tweet-content">Tweet Content</Label>
                  <Textarea
                    id="new-tweet-content"
                    placeholder="What's happening?"
                    value={newTweetContent}
                    onChange={(e) => setNewTweetContent(e.target.value)}
                    className="mt-1"
                    rows={3}
                    maxLength={280}
                  />
                  <div className="text-xs text-muted-foreground mt-1">{newTweetContent.length}/280 characters</div>
                </div>
                <div>
                  <Label htmlFor="new-tweet-time">Time</Label>
                  <Input
                    id="new-tweet-time"
                    type="time"
                    value={newTweetTime}
                    onChange={(e) => setNewTweetTime(e.target.value)}
                    className="mt-1 w-32"
                  />
                </div>
                <Button
                  onClick={handleAddTweetFromCalendar}
                  disabled={!newTweetContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Schedule Tweet
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tweet Dialog */}
      <Dialog open={!!editingTweet} onOpenChange={() => setEditingTweet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tweet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="mt-1"
                rows={4}
              />
              <div className="text-xs text-muted-foreground mt-1">{editContent.length}/280 characters</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingTweet(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/20 border border-primary/20"></div>
              <span className="text-muted-foreground">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/20"></div>
              <span className="text-muted-foreground">Published</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted border border-border"></div>
              <span className="text-muted-foreground">Draft</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
