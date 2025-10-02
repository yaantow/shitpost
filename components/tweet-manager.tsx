"use client"

import { useState, useMemo } from "react"
import { Search, Filter, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Tweet } from "@/app/page"

interface TweetManagerProps {
  tweets: Tweet[]
  onUpdateTweet: (id: string, updates: Partial<Tweet>) => void
  onDeleteTweet: (id: string) => void
}

export function TweetManager({ tweets, onUpdateTweet, onDeleteTweet }: TweetManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Tweet["status"]>("scheduled")
  const [sortBy, setSortBy] = useState<"scheduled" | "created" | "content">("scheduled")
  const [editingTweet, setEditingTweet] = useState<Tweet | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editStatus, setEditStatus] = useState<Tweet["status"]>("scheduled")

  const filteredAndSortedTweets = useMemo(() => {
    let filtered = tweets

    if (searchQuery) {
      filtered = filtered.filter((tweet) => tweet.content.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((tweet) => tweet.status === statusFilter)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "scheduled":
          return a.scheduledDate.getTime() - b.scheduledDate.getTime()
        case "created":
          return b.createdAt.getTime() - a.createdAt.getTime()
        case "content":
          return a.content.localeCompare(b.content)
        default:
          return 0
      }
    })

    return filtered
  }, [tweets, searchQuery, statusFilter, sortBy])

  const getStatusColor = (status: Tweet["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
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
    setEditStatus(tweet.status)
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
      status: editStatus,
    })

    setEditingTweet(null)
    resetEditForm()
  }

  const resetEditForm = () => {
    setEditContent("")
    setEditDate("")
    setEditTime("")
    setEditStatus("scheduled")
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getTimeStatus = (date: Date, status: Tweet["status"]) => {
    if (status === "published") return "Published"
    if (status === "draft") return "Draft"

    const now = new Date()
    const diff = date.getTime() - now.getTime()

    if (diff < 0) return "Overdue"
    if (diff < 60000) return "Soon"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return `${Math.floor(diff / 86400000)}d`
  }

  const handleQuickReschedule = (tweetId: string, minutes: number) => {
    const newDate = new Date(Date.now() + minutes * 60000)
    onUpdateTweet(tweetId, { scheduledDate: newDate })
  }

  const handleQuickStatusChange = (tweetId: string, status: Tweet["status"]) => {
    onUpdateTweet(tweetId, { status })
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Manage Tweets ({filteredAndSortedTweets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tweets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: "all" | Tweet["status"]) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: "scheduled" | "created" | "content") => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">By Schedule</SelectItem>
                <SelectItem value="created">By Created</SelectItem>
                <SelectItem value="content">By Content</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          {filteredAndSortedTweets.length === 0 ? (
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tweets found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Start by composing your first tweet."}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="w-[150px]">Scheduled</TableHead>
                  <TableHead className="w-[120px]">Quick Actions</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTweets.map((tweet) => (
                  <TableRow
                    key={tweet.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleEditTweet(tweet)}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={`${getStatusColor(tweet.status)} text-xs`} variant="outline">
                          {tweet.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getTimeStatus(tweet.scheduledDate, tweet.status)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm truncate" title={tweet.content}>
                        {tweet.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{tweet.content.length}/280</span>
                        {tweet.isThread && (
                          <Badge variant="outline" className="text-xs">
                            Thread
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDateTime(tweet.scheduledDate)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {tweet.status === "scheduled" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickReschedule(tweet.id, 30)}
                              className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            >
                              +30m
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickReschedule(tweet.id, 60)}
                              className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            >
                              +1h
                            </Button>
                          </>
                        )}
                        {tweet.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickStatusChange(tweet.id, "scheduled")}
                            className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700 text-white border-green-600"
                          >
                            Schedule
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-300">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Tweet</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this tweet? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteTweet(tweet.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Tweet Dialog */}
      <Dialog open={!!editingTweet} onOpenChange={() => setEditingTweet(null)}>
        <DialogContent className="max-w-md">
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
                maxLength={280}
              />
              <div className="text-xs text-muted-foreground mt-1">{editContent.length}/280 characters</div>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(value: Tweet["status"]) => setEditStatus(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingTweet(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!editContent.trim() || editContent.length > 280}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
