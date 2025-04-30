"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Icons } from "@/components/ui/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { UserProfile } from "@/types/database"

export function ProfileForm() {
  const { user, profile, updateProfile, uploadAvatar, isLoading } = useAuth()
  const [formValues, setFormValues] = useState<Partial<UserProfile>>({
    display_name: "",
    bio: "",
    experience_level: "Beginner",
    account_balance: 0,
    account_currency: "USD",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setFormValues({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        experience_level: profile.experience_level || "Beginner",
        account_balance: profile.account_balance || 0,
        account_currency: profile.account_currency || "USD",
      })
    }
  }, [profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (name: string, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      setFormValues((prev) => ({ ...prev, [name]: numValue }))
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatarPreview(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    try {
      // Upload avatar if selected
      if (avatarFile) {
        const { success, url, error } = await uploadAvatar(avatarFile)
        if (!success) {
          throw new Error(error || "Failed to upload avatar")
        }
      }

      // Update profile
      const { success, error } = await updateProfile(formValues)
      if (!success) {
        throw new Error(error || "Failed to update profile")
      }

      setSuccess(true)
      // Reset avatar file after successful upload
      setAvatarFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Your profile has been updated successfully.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarPreview || profile?.avatar_url || ""} />
            <AvatarFallback className="text-lg">
              {profile?.display_name ? getInitials(profile.display_name) : user?.email?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center">
            <Label htmlFor="avatar" className="cursor-pointer text-sm text-primary hover:underline">
              Change Avatar
            </Label>
            <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={formValues.display_name || ""}
                onChange={handleChange}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_level">Experience Level</Label>
              <Select
                value={formValues.experience_level || "Beginner"}
                onValueChange={(value) => handleSelectChange("experience_level", value)}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formValues.bio || ""}
              onChange={handleChange}
              rows={4}
              className="bg-background/50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account_balance">Account Balance</Label>
              <Input
                id="account_balance"
                type="number"
                step="0.01"
                value={formValues.account_balance || 0}
                onChange={(e) => handleNumberChange("account_balance", e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_currency">Currency</Label>
              <Select
                value={formValues.account_currency || "USD"}
                onValueChange={(value) => handleSelectChange("account_currency", value)}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </form>
    </div>
  )
}
