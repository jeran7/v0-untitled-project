"use client"

import React, { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import type { AuthContextType, AuthState } from "@/types/auth"
import type { UserProfile, UserSettings } from "@/types/database"

const initialState: AuthState = {
  user: null,
  session: null,
  profile: null,
  settings: null,
  isLoading: true,
  error: null,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch user profile
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

      if (error) throw error

      return data as UserProfile
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  }, [])

  // Fetch user settings
  const fetchUserSettings = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).single()

      if (error) throw error

      return data as UserSettings
    } catch (error) {
      console.error("Error fetching user settings:", error)
      return null
    }
  }, [])

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!state.user) return

    try {
      const profile = await fetchUserProfile(state.user.id)
      setState((prev) => ({ ...prev, profile }))
    } catch (error) {
      console.error("Error refreshing profile:", error)
    }
  }, [state.user, fetchUserProfile])

  // Refresh settings data
  const refreshSettings = useCallback(async () => {
    if (!state.user) return

    try {
      const settings = await fetchUserSettings(state.user.id)
      setState((prev) => ({ ...prev, settings }))
    } catch (error) {
      console.error("Error refreshing settings:", error)
    }
  }, [state.user, fetchUserSettings])

  // Initial session check and setup auth listener
  useEffect(() => {
    setState((prev) => ({ ...prev, isLoading: true }))
    console.log("Setting up auth state listener")

    // Get current session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error)
        setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
        return
      }

      console.log("Session retrieved:", session ? "✓" : "✗")

      if (session?.user) {
        const [profile, settings] = await Promise.all([
          fetchUserProfile(session.user.id),
          fetchUserSettings(session.user.id),
        ])

        setState({
          user: session.user,
          session,
          profile,
          settings,
          isLoading: false,
          error: null,
        })
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          settings: null,
          isLoading: false,
          error: null,
        })
      }
    })

    // Set up auth state change listener
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event)

        if (session?.user) {
          const [profile, settings] = await Promise.all([
            fetchUserProfile(session.user.id),
            fetchUserSettings(session.user.id),
          ])

          setState({
            user: session.user,
            session,
            profile,
            settings,
            isLoading: false,
            error: null,
          })

          // Handle specific auth events
          if (event === "SIGNED_IN") {
            console.log("User signed in:", session.user.email)
            toast({
              title: "Signed in successfully",
              description: `Welcome${profile?.display_name ? `, ${profile.display_name}` : ""}!`,
            })
            router.refresh()
          }
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            settings: null,
            isLoading: false,
            error: null,
          })

          if (event === "SIGNED_OUT") {
            console.log("User signed out")
            toast({
              title: "Signed out",
              description: "You have been signed out successfully.",
            })
            router.push("/")
          }
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (err) {
      console.error("Error setting up auth listener:", err)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [fetchUserProfile, fetchUserSettings, router, toast])

  // Register new user with email and password
  const signUp = useCallback(
    async (email: string, password: string, metadata?: Record<string, any>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        console.log("Signing up user:", email)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
          },
        })

        if (error) {
          throw error
        }

        toast({
          title: "Success",
          description: "Check your email for a confirmation link.",
        })

        return { success: true }
      } catch (error: any) {
        console.error("Sign up error:", error)
        setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        })
        return { success: false, error: error.message }
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [toast],
  )

  // Sign in with email and password
  const signIn = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        console.log("Signing in user:", email)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw error
        }

        console.log("Sign in successful:", data.user?.email)
        // Auth state listener will handle session update and navigation
        return { success: true }
      } catch (error: any) {
        console.error("Sign in error:", error)
        setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        })
        return { success: false, error: error.message }
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [toast],
  )

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log("Initiating Google sign in")
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // The redirect will happen automatically
    } catch (error: any) {
      console.error("Google sign in error:", error)
      setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [toast])

  // Sign in with GitHub OAuth
  const signInWithGithub = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log("Initiating GitHub sign in")
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // The redirect will happen automatically
    } catch (error: any) {
      console.error("GitHub sign in error:", error)
      setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
      toast({
        title: "GitHub sign in failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [toast])

  // Sign out
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      console.log("Signing out user")
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      // Auth state listener will handle session update and navigation
    } catch (error: any) {
      console.error("Sign out error:", error)
      setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [toast])

  // Reset password with email
  const resetPassword = useCallback(
    async (email: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        console.log("Sending password reset email to:", email)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        if (error) {
          throw error
        }

        toast({
          title: "Password reset email sent",
          description: "Check your email for a password reset link.",
        })

        return { success: true }
      } catch (error: any) {
        console.error("Password reset error:", error)
        setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        })
        return { success: false, error: error.message }
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [toast],
  )

  // Update password after reset
  const updatePassword = useCallback(
    async (newPassword: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        console.log("Updating user password")
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        })

        if (error) {
          throw error
        }

        toast({
          title: "Password updated",
          description: "Your password has been updated successfully.",
        })

        return { success: true }
      } catch (error: any) {
        console.error("Password update error:", error)
        setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive",
        })
        return { success: false, error: error.message }
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [toast],
  )

  // Update user profile
  const updateProfile = useCallback(
    async (profile: Partial<UserProfile>) => {
      if (!state.user) {
        return { success: false, error: "User not authenticated" }
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const { error } = await supabase.from("user_profiles").update(profile).eq("user_id", state.user.id)

        if (error) throw error

        // Refresh profile data
        const updatedProfile = await fetchUserProfile(state.user.id)
        setState((prev) => ({ ...prev, profile: updatedProfile, isLoading: false }))

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })

        return { success: true }
      } catch (error: any) {
        console.error("Profile update error:", error)
        setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
        toast({
          title: "Profile update failed",
          description: error.message,
          variant: "destructive",
        })
        return { success: false, error: error.message }
      }
    },
    [state.user, fetchUserProfile, toast],
  )

  // Update user settings
  const updateSettings = useCallback(
    async (settings: Partial<UserSettings>) => {
      if (!state.user) {
        return { success: false, error: "User not authenticated" }
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const { error } = await supabase.from("user_settings").update(settings).eq("user_id", state.user.id)

        if (error) throw error

        // Refresh settings data
        const updatedSettings = await fetchUserSettings(state.user.id)
        setState((prev) => ({ ...prev, settings: updatedSettings, isLoading: false }))

        toast({
          title: "Settings updated",
          description: "Your settings have been updated successfully.",
        })

        return { success: true }
      } catch (error: any) {
        console.error("Settings update error:", error)
        setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
        toast({
          title: "Settings update failed",
          description: error.message,
          variant: "destructive",
        })
        return { success: false, error: error.message }
      }
    },
    [state.user, fetchUserSettings, toast],
  )

  // Upload avatar
  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!state.user) {
        return { success: false, error: "User not authenticated" }
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        // Generate a unique file path
        const fileExt = file.name.split(".").pop()
        const filePath = `avatars/${state.user.id}/${Date.now()}.${fileExt}`

        // Upload the file
        const { error: uploadError, data } = await supabase.storage.from("user-content").upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        })

        if (uploadError) throw uploadError

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("user-content").getPublicUrl(filePath)

        // Update the user profile with the new avatar URL
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ avatar_url: publicUrl })
          .eq("user_id", state.user.id)

        if (updateError) throw updateError

        // Refresh profile data
        const updatedProfile = await fetchUserProfile(state.user.id)
        setState((prev) => ({ ...prev, profile: updatedProfile, isLoading: false }))

        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully.",
        })

        return { success: true, url: publicUrl }
      } catch (error: any) {
        console.error("Avatar upload error:", error)
        setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
        toast({
          title: "Avatar upload failed",
          description: error.message,
          variant: "destructive",
        })
        return { success: false, error: error.message }
      }
    },
    [state.user, fetchUserProfile, toast],
  )

  // Delete account
  const deleteAccount = useCallback(async () => {
    if (!state.user) {
      return { success: false, error: "User not authenticated" }
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Delete user from Supabase Auth
      const { error } = await supabase.auth.admin.deleteUser(state.user.id)

      if (error) throw error

      // The auth state listener will handle the sign out and navigation
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully.",
      })

      return { success: true }
    } catch (error: any) {
      console.error("Account deletion error:", error)
      setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
      toast({
        title: "Account deletion failed",
        description: error.message,
        variant: "destructive",
      })
      return { success: false, error: error.message }
    }
  }, [state.user, toast])

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    updateSettings,
    uploadAvatar,
    deleteAccount,
    refreshProfile,
    refreshSettings,
  }

  // Replace JSX with React.createElement
  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    console.warn("useAuth must be used within an AuthProvider")
    return {
      user: null,
      session: null,
      profile: null,
      settings: null,
      isLoading: false,
      error: "AuthProvider not found",
      signUp: async () => ({ success: false, error: "AuthProvider not found" }),
      signIn: async () => ({ success: false, error: "AuthProvider not found" }),
      signInWithGoogle: async () => {},
      signInWithGithub: async () => {},
      signOut: async () => {},
      resetPassword: async () => ({ success: false, error: "AuthProvider not found" }),
      updatePassword: async () => ({ success: false, error: "AuthProvider not found" }),
      updateProfile: async () => ({ success: false, error: "AuthProvider not found" }),
      updateSettings: async () => ({ success: false, error: "AuthProvider not found" }),
      uploadAvatar: async () => ({ success: false, error: "AuthProvider not found" }),
      deleteAccount: async () => ({ success: false, error: "AuthProvider not found" }),
      refreshProfile: async () => {},
      refreshSettings: async () => {},
    }
  }
  return context
}
