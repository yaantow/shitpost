"use client"
import { useState } from "react"
import { Clock, Plus, Minus, CalendarIcon, Edit, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Tweet, TweetInput } from "@/types/tweet"

interface TweetComposerProps {
  onAddTweet: (tweet: TweetInput) => void
  onUpdateTweet: (id: string, updates: Partial<Tweet>) => void
  onDeleteTweet: (id: string) => void
  tweets: Tweet[]
}

export function TweetComposer({ onAddTweet, onUpdateTweet, onDeleteTweet, tweets }: TweetComposerProps) {
  const [content, setContent] = useState("")
  const [isThread, setIsThread] = useState(false)
  const [threadTweets, setThreadTweets] = useState<string[]>([""])
  const [editingTweet, setEditingTweet] = useState<Tweet | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedIsNextMonth, setSelectedIsNextMonth] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [postStatus, setPostStatus] = useState<"idle" | "posting" | "success" | "error">("idle")

  const characterCount = content.length
  const maxCharacters = 280
  const isOverLimit = characterCount > maxCharacters

  const handleQuickSchedule = (day?: number, timeSlot?: string, isNextMonth?: boolean) => {
    if (!content.trim() || isOverLimit) return

    let scheduledDate: Date

    if (day && timeSlot) {
      scheduledDate = new Date()
      if (isNextMonth) {
        scheduledDate.setMonth(scheduledDate.getMonth() + 1)
      }
      scheduledDate.setDate(day)
      
      // Parse time slot (e.g., "09:00am", "11:59am", "02:00pm", "04:00pm", "09:00pm")
      const timeSlotLower = timeSlot.toLowerCase()
      const isPM = timeSlotLower.includes('pm')
      const timeMatch = timeSlot.match(/(\d{1,2}):(\d{2})/)
      
      if (timeMatch) {
        let hours = parseInt(timeMatch[1])
        const minutes = parseInt(timeMatch[2])
        
        if (isPM && hours !== 12) {
          hours += 12
        } else if (!isPM && hours === 12) {
          hours = 0
        }
        
        scheduledDate.setHours(hours, minutes, 0, 0)
      }
    } else {
      scheduledDate = new Date()
    }

    if (isThread) {
      const validThreadTweets = threadTweets.filter((tweet) => tweet.trim())
      onAddTweet({
        content: validThreadTweets[0],
        scheduledDate,
        status: "scheduled",
        isThread: true,
        threadTweets: validThreadTweets,
      })
    } else {
      onAddTweet({
        content: content.trim(),
        scheduledDate,
        status: "scheduled",
      })
    }

    setContent("")
    setThreadTweets([""])
    setIsThread(false)
    setSelectedDay(null)
    setSelectedIsNextMonth(false)
    setSelectedTimeSlot(null)
  }

  const executeScheduleWithDateTime = (scheduledDate: Date) => {
    if (!content.trim() || isOverLimit) return

    if (isThread) {
      const validThreadTweets = threadTweets.filter((tweet) => tweet.trim())
      onAddTweet({
        content: validThreadTweets[0],
        scheduledDate,
        status: "scheduled",
        isThread: true,
        threadTweets: validThreadTweets,
      })
    } else {
      onAddTweet({
        content: content.trim(),
        scheduledDate,
        status: "scheduled",
      })
    }

    setContent("")
    setThreadTweets([""])
    setIsThread(false)
    setSelectedDay(null)
    setSelectedIsNextMonth(false)
    setSelectedTimeSlot(null)
  }

  const executeScheduleWithTimeSlot = (day: number, timeSlot: string, isNextMonth: boolean) => {
    if (!content.trim() || isOverLimit) return

    const scheduledDate = new Date()
    if (isNextMonth) {
      scheduledDate.setMonth(scheduledDate.getMonth() + 1)
    }
    scheduledDate.setDate(day)
    
    // Parse time slot (e.g., "09:00am", "11:59am", "02:00pm", "04:00pm", "09:00pm")
    const timeSlotLower = timeSlot.toLowerCase()
    const isPM = timeSlotLower.includes('pm')
    const timeMatch = timeSlot.match(/(\d{1,2}):(\d{2})/)
    
    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = parseInt(timeMatch[2])
      
      if (isPM && hours !== 12) {
        hours += 12
      } else if (!isPM && hours === 12) {
        hours = 0
      }
      
      scheduledDate.setHours(hours, minutes, 0, 0)
    }

    executeScheduleWithDateTime(scheduledDate)
  }

  const handleDaySelection = (day: number, isNextMonth?: boolean) => {
    setSelectedDay(day)
    setSelectedIsNextMonth(isNextMonth || false)

    if (selectedTimeSlot !== null) {
      executeScheduleWithTimeSlot(day, selectedTimeSlot, isNextMonth || false)
    }
  }

  const handleTimeSelection = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot)

    if (selectedDay !== null) {
      executeScheduleWithTimeSlot(selectedDay, timeSlot, selectedIsNextMonth)
    }
  }

  const addThreadTweet = () => {
    setThreadTweets([...threadTweets, ""])
  }

  const removeThreadTweet = (index: number) => {
    if (threadTweets.length > 1) {
      setThreadTweets(threadTweets.filter((_, i) => i !== index))
    }
  }

  const updateThreadTweet = (index: number, value: string) => {
    const newThreadTweets = [...threadTweets]
    newThreadTweets[index] = value
    setThreadTweets(newThreadTweets)
  }

  const getCharacterCountColor = (count: number) => {
    if (count > 260) return "text-red-400"
    if (count > 240) return "text-yellow-400"
    return "text-muted-foreground"
  }

  const getTweetsPerDay = () => {
    const today = new Date()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const tweetsPerDay: { [key: number]: number } = {}

    tweets
      .filter((t) => t.status === "scheduled")
      .forEach((tweet) => {
        const day = tweet.scheduledDate.getDate()
        const month = tweet.scheduledDate.getMonth()
        const year = tweet.scheduledDate.getFullYear()

        if (month === today.getMonth() && year === today.getFullYear()) {
          tweetsPerDay[day] = (tweetsPerDay[day] || 0) + 1
        }
      })

    return { tweetsPerDay, daysInMonth }
  }

  const getTodaysPendingPosts = () => {
    const today = new Date()
    return tweets
      .filter((tweet) => {
        const tweetDate = new Date(tweet.scheduledDate)
        return tweet.status === "scheduled" && tweetDate.toDateString() === today.toDateString()
      })
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
  }

  const handleEditTodayPost = (tweet: Tweet) => {
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

  const generateDayButtons = () => {
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysInNextMonth = new Date(currentYear, currentMonth + 2, 0).getDate()

    const currentMonthDays = []
    const nextMonthDays = []

    for (let day = currentDay; day <= daysInCurrentMonth; day++) {
      const isSelected = selectedDay === day && !selectedIsNextMonth
      currentMonthDays.push(
        <Button
          key={`current-${day}`}
          variant={isSelected ? "default" : "outline"}
          size="sm"
          onClick={() => handleDaySelection(day)}
          disabled={(!content.trim() && !isThread) || isOverLimit}
          className={`h-8 px-2 ${
            isSelected
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          }`}
        >
          {day}
        </Button>,
      )
    }

    for (let day = 1; day <= Math.min(10, daysInNextMonth); day++) {
      const isSelected = selectedDay === day && selectedIsNextMonth
      nextMonthDays.push(
        <Button
          key={`next-${day}`}
          variant={isSelected ? "default" : "outline"}
          size="sm"
          onClick={() => handleDaySelection(day, true)}
          disabled={(!content.trim() && !isThread) || isOverLimit}
          className={`h-8 px-2 ${
            isSelected
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 opacity-75"
          }`}
        >
          {day}
        </Button>,
      )
    }

    return [...currentMonthDays, ...nextMonthDays]
  }

  const generateTimeButtons = () => {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Fixed time slots - two sets of 5 options each
      const timeOptions = [
        // First set
        { label: "7:30am", timeSlot: "07:30am" },
        { label: "9:00am", timeSlot: "09:00am" },
        { label: "11:59am", timeSlot: "11:59am" },
        { label: "2:00pm", timeSlot: "02:00pm" },
        { label: "11:44pm", timeSlot: "11:44pm" },
        
        // Second set      
        { label: "4:00pm", timeSlot: "04:00pm" },
        { label: "3:45pm", timeSlot: "03:45pm" },
        { label: "6:30pm", timeSlot: "06:30pm" },
        { label: "9:00pm", timeSlot: "09:00pm" },
        { label: "10:15pm", timeSlot: "10:15pm" },
      ]

    // Check if "Today" is selected
    const isTodaySelected = selectedDay === now.getDate() && !selectedIsNextMonth

    return timeOptions.map((option) => {
      const isSelected = selectedTimeSlot === option.timeSlot
      
      // If today is selected, check if the time has passed
      let isDisabled = (!content.trim() && !isThread) || isOverLimit
      if (isTodaySelected) {
        // Parse time from timeSlot
        const timeSlotLower = option.timeSlot.toLowerCase()
        const isPM = timeSlotLower.includes('pm')
        const timeMatch = option.timeSlot.match(/(\d{1,2}):(\d{2})/)
        
        if (timeMatch) {
          let hours = parseInt(timeMatch[1])
          const minutes = parseInt(timeMatch[2])
          
          if (isPM && hours !== 12) {
            hours += 12
          } else if (!isPM && hours === 12) {
            hours = 0
          }
          
          const optionTime = new Date()
          optionTime.setHours(hours, minutes, 0, 0)
          isDisabled = isDisabled || optionTime <= now
        }
      }

      return (
        <Button
          key={option.label}
          variant={isSelected ? "default" : "outline"}
          size="sm"
          onClick={() => handleTimeSelection(option.timeSlot)}
          disabled={isDisabled}
          className={`h-10 px-3 ${
            isSelected
              ? "bg-blue-600 text-white border-blue-600"
              : isDisabled && isTodaySelected
              ? "bg-gray-400 text-gray-600 border-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          }`}
        >
          <span className="text-sm font-medium">{option.label}</span>
        </Button>
      )
    })
  }

  const { tweetsPerDay, daysInMonth } = getTweetsPerDay()
  const todaysPosts = getTodaysPendingPosts()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={isThread ? "default" : "outline"}
              size="sm"
              onClick={() => setIsThread(!isThread)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Thread Mode
            </Button>
            {isThread && (
              <Badge variant="secondary" className="text-xs">
                {threadTweets.filter((t) => t.trim()).length} tweets
              </Badge>
            )}
            <Button
              onClick={async () => {
                setIsPosting(true)
                setPostStatus("posting")
                try {
                  await handleQuickSchedule()
                  setPostStatus("success")
                  setTimeout(() => setPostStatus("idle"), 3000)
                } catch (error) {
                  setPostStatus("error")
                  setTimeout(() => setPostStatus("idle"), 3000)
                } finally {
                  setIsPosting(false)
                }
              }}
              disabled={(!content.trim() && !isThread) || isOverLimit || isPosting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isPosting ? "Posting..." : postStatus === "success" ? "Posted!" : postStatus === "error" ? "Error" : "Post Now"}
            </Button>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              {!isThread ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Textarea
                      placeholder="What's happening? Start typing..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[100px] resize-none text-lg border-0 bg-transparent focus-visible:ring-0 p-0"
                      maxLength={300}
                    />
                    <div className="flex justify-end">
                      <div className={`text-sm font-medium ${getCharacterCountColor(characterCount)}`}>
                        {characterCount}/{maxCharacters}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {threadTweets.map((tweet, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {index + 1}
                        </Badge>
                        {threadTweets.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeThreadTweet(index)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        placeholder={`Tweet ${index + 1}...`}
                        value={tweet}
                        onChange={(e) => updateThreadTweet(index, e.target.value)}
                        className="min-h-[80px] resize-none border-0 bg-transparent focus-visible:ring-0 p-0"
                        maxLength={280}
                      />
                      <div className="flex justify-end">
                        <div className={`text-sm font-medium ${getCharacterCountColor(tweet.length)}`}>
                          {tweet.length}/280
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addThreadTweet}
                    className="w-full bg-transparent"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tweet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-blue-400" />
                <h3 className="font-medium">Quick Schedule</h3>
                {(selectedDay !== null || selectedTimeSlot !== null) && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedDay !== null && selectedTimeSlot !== null
                      ? "Auto-scheduled!"
                      : selectedDay !== null
                        ? `Day ${selectedDay} selected${selectedIsNextMonth ? " (next month)" : ""} - select time`
                        : `${selectedTimeSlot} selected - select day`}
                  </Badge>
                )}
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Select Day</h4>
                <div className="flex flex-wrap gap-1">{generateDayButtons()}</div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Select Time</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">{generateTimeButtons()}</div>
              </div>

              {selectedDay === null && selectedTimeSlot === null && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground text-center">
                    Select both day and time to auto-schedule your tweet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {todaysPosts.length > 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="h-4 w-4 text-blue-400" />
                  <h3 className="font-medium">Today's Scheduled Posts ({todaysPosts.length})</h3>
                </div>
                <div className="space-y-2">
                  {todaysPosts.map((tweet) => (
                    <div key={tweet.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{tweet.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {tweet.scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTodayPost(tweet)}
                          className="h-8 w-8 p-0"
                        >
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
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="h-4 w-4 text-blue-400" />
                <h3 className="font-medium text-sm">This Month</h3>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <div key={day} className="text-center text-muted-foreground font-medium p-1">
                    {day}
                  </div>
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const count = tweetsPerDay[day] || 0
                  return (
                    <div
                      key={day}
                      className={`text-center p-1 rounded text-xs ${
                        count > 0 ? "bg-blue-600/20 text-blue-400 font-medium" : "text-muted-foreground"
                      }`}
                    >
                      <div>{day}</div>
                      {count > 0 && <div className="text-xs text-blue-400">{count}</div>}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Scheduled</span>
                  <span className="text-blue-400 font-medium">
                    {tweets.filter((t) => t.status === "scheduled").length}
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-muted-foreground">Published</span>
                  <span className="text-green-400 font-medium">
                    {tweets.filter((t) => t.status === "published").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  )
}
