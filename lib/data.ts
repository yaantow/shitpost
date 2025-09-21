import type { Tweet } from "@/app/page"

// Sample data for the tweet scheduler
export const sampleTweets: Tweet[] = [
  {
    id: "1",
    content: "Just shipped a new feature! The feeling when everything works perfectly on the first try 🚀",
    scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    status: "scheduled",
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: "2",
    content:
      "Hot take: The best code is the code you don't have to write. Sometimes the simplest solution is the right one.",
    scheduledDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    status: "scheduled",
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: "3",
    content: "Monday motivation: Every expert was once a beginner. Every pro was once an amateur. Keep building! 💪",
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    status: "scheduled",
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: "4",
    content:
      "Quick tip: Use console.log() strategically. Too many and you'll miss the important ones. Too few and you'll be debugging blind.",
    scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
    status: "scheduled",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "5",
    content:
      "Breaking: Just discovered that rubber duck debugging actually works. My desk duck is now my senior developer.",
    scheduledDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago (published)
    status: "published",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "6",
    content:
      "Unpopular opinion: Documentation is just as important as the code itself. Future you will thank present you.",
    scheduledDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago (published)
    status: "published",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: "7",
    content: "Today I learned: The difference between knowing the path and walking the path. Time to walk.",
    scheduledDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    status: "scheduled",
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: "8",
    content:
      "Fun fact: The first computer bug was an actual bug. A moth trapped in a Harvard Mark II computer in 1947.",
    scheduledDate: new Date(Date.now() + 36 * 60 * 60 * 1000), // 1.5 days from now
    status: "scheduled",
    createdAt: new Date(Date.now() - 90 * 60 * 1000),
  },
]

// Quick schedule options with times
export const quickScheduleOptions = [
  { label: "Now", minutes: 0, time: "now" },
  { label: "5 min", minutes: 5, time: "5m" },
  { label: "30 min", minutes: 30, time: "30m" },
  { label: "1 hour", minutes: 60, time: "1h" },
  { label: "2 hours", minutes: 120, time: "2h" },
  { label: "4 hours", minutes: 240, time: "4h" },
  { label: "8 hours", minutes: 480, time: "8h" },
  { label: "Tomorrow 9 AM", minutes: "tomorrow", time: "9am" },
]

// Tweet thread interface
export interface TweetThread {
  id: string
  tweets: string[]
  scheduledDate: Date
  status: "scheduled" | "published" | "draft"
  createdAt: Date
}
