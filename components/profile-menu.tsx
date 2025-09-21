"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { User, LogOut, Twitter, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Profile {
  id: string
  email: string
  display_name: string
  twitter_username?: string
  twitter_access_token?: string
}

export function ProfileMenu() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setIsLoading(false)
          return
        }

        const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Profile error:", error)
          // Create a basic profile if none exists
          const basicProfile = {
            id: user.id,
            email: user.email || '',
            display_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
            twitter_username: user.user_metadata?.user_name || user.user_metadata?.preferred_username
          }
          setProfile(basicProfile)
        } else if (profileData) {
          setProfile(profileData)
        } else {
          // Fallback profile
          const fallbackProfile = {
            id: user.id,
            email: user.email || '',
            display_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
            twitter_username: user.user_metadata?.user_name || user.user_metadata?.preferred_username
          }
          setProfile(fallbackProfile)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getProfile()

    // Refresh profile when returning from Twitter OAuth
    const handleFocus = () => {
      refreshProfile()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleConnectTwitter = async () => {
    try {
      const response = await fetch('/api/auth/twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to initiate Twitter OAuth')
      }
      
      const { authUrl } = await response.json()
      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting Twitter:', error)
    }
  }

  const refreshProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        console.error("Profile error:", error)
        return
      }

      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error("Error refreshing profile:", error)
    }
  }

  if (isLoading) {
    return <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
  }

  // Always show the avatar, even if profile data is incomplete
  if (!profile) {
    return (
      <>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full p-0"
          onClick={() => setIsDialogOpen(true)}
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Profile</DialogTitle>
              <DialogDescription>Loading profile information...</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  const initials =
    profile.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || profile.email[0].toUpperCase()

  return (
    <>
      <Button 
        variant="ghost" 
        className="relative h-10 w-10 rounded-full p-0"
        onClick={() => setIsDialogOpen(true)}
      >
        <Avatar className="h-10 w-10">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>
              Manage your account and connected services
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Profile Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-medium text-lg">{profile.display_name || "User"}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                {profile.twitter_username && (
                  <p className="text-sm text-blue-500">@{profile.twitter_username}</p>
                )}
              </div>
            </div>

            {/* Twitter Connection Status */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter/X Connection
              </h4>
              
              {profile.twitter_access_token ? (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Connected
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleConnectTwitter}
                  >
                    Reconnect
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      Not Connected
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleConnectTwitter}
                  >
                    Connect
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleLogout} className="flex-1">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
