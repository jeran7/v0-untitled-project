"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "@/components/profile/profile-form"
import { SettingsForm } from "@/components/profile/settings-form"
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LogIn } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6">
        <div className="glass-card p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to view your profile.</p>
          <Button onClick={() => router.push("/auth/login")} className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10 animate-in">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />

          <div className="glass-card rounded-lg border border-border/40 backdrop-blur-2xl bg-background/90 p-6">
            <Skeleton className="h-10 w-full mb-6" />
            <div className="space-y-6">
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10 animate-in">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>

        <div className="glass-card rounded-lg border border-border/40 backdrop-blur-2xl bg-background/90">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/30 rounded-t-lg">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="profile" className="mt-0">
                <ProfileForm />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <SettingsForm />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="glass-card rounded-lg border border-border/40 backdrop-blur-2xl bg-background/90 p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <DeleteAccountDialog />
          </div>
        </div>
      </div>
    </div>
  )
}
