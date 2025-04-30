"use client"

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import type { AuthContextType, AuthState, SubscriptionFeature } from "@/types/auth"
import type { UserProfile, UserSettings, UserSubscription, SubscriptionPlan, UsageTracking } from "@/types/database"

const initialState: AuthState = {
  user: null,
  session: null,
  profile: null,
  settings: null,
  subscription: null,
  subscriptionPlan: null,
  usage: null,
  isLoading: true, // This is set to true by default
  error: null,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to handle Supabase API errors
const handleSupabaseError = (error: any, operation: string): null => {
  // Check if it's a network error
  if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
    console.warn(`Network error during ${operation}. Check your connection.`)
    return null
  }

  // Check if it's a rate limit error
  if (error?.message?.includes("Too Many R")) {
    console.warn(`Rate limit hit during ${operation}. Will retry later.`)
    return null
  }

  // Log other errors
  console.error(`Error during ${operation}:`, error)
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)
  const { toast } = useToast()
  const router = useRouter()
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [lastSignInEvent, setLastSignInEvent] = useState<string | null>(null)
  const [isProduction, setIsProduction] = useState(false)

  // Check if we're in production environment
  useEffect(() => {
    // Check if we're in production (deployed to Vercel)
    const isVercelProduction =
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      !window.location.hostname.includes("vercel.app")

    setIsProduction(isVercelProduction)

    if (isVercelProduction) {
      console.log("Auth Provider: Running in production environment")
    }
  }, [])

  // Create user profile if it doesn't exist
  const createUserProfile = useCallback(async (userId: string, email: string) => {
    try {
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)

      if (checkError) {
        return handleSupabaseError(checkError, "checking user profile")
      }

      // If profile doesn't exist, create it
      if (!existingProfile || existingProfile.length === 0) {
        const newProfile = {
          id: userId,
          display_name: email.split("@")[0], // Default display name from email
          trading_experience: "beginner",
          account_size: 10000,
          daily_risk_limit: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase.from("user_profiles").insert(newProfile).select().single()

        if (error) {
          return handleSupabaseError(error, "creating user profile")
        }

        return data as UserProfile
      }

      // Return the first existing profile
      return existingProfile[0] as UserProfile
    } catch (error) {
      return handleSupabaseError(error, "createUserProfile")
    }
  }, [])

  // Create user settings if they don't exist
  const createUserSettings = useCallback(async (userId: string) => {
    try {
      // Check if settings exist
      const { data: existingSettings, error: checkError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("id", userId)

      if (checkError) {
        return handleSupabaseError(checkError, "checking user settings")
      }

      // If settings don't exist, create them
      if (!existingSettings || existingSettings.length === 0) {
        const newSettings = {
          id: userId,
          default_risk_percentage: 1,
          default_commission: 0,
          theme: "dark",
          email_notifications: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase.from("user_settings").insert(newSettings).select().single()

        if (error) {
          return handleSupabaseError(error, "creating user settings")
        }

        return data as UserSettings
      }

      // Return the first existing settings
      return existingSettings[0] as UserSettings
    } catch (error) {
      return handleSupabaseError(error, "createUserSettings")
    }
  }, [])

  // Fetch user profile
  const fetchUserProfile = useCallback(
    async (userId: string, email?: string) => {
      try {
        const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId)

        if (error) {
          return handleSupabaseError(error, "fetching user profile")
        }

        // If no profile exists and we have an email, create one
        if ((!data || data.length === 0) && email) {
          return await createUserProfile(userId, email)
        }

        // Return the first profile if multiple exist
        return data && data.length > 0 ? (data[0] as UserProfile) : null
      } catch (error) {
        return handleSupabaseError(error, "fetchUserProfile")
      }
    },
    [createUserProfile],
  )

  // Fetch user settings
  const fetchUserSettings = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase.from("user_settings").select("*").eq("id", userId)

        if (error) {
          return handleSupabaseError(error, "fetching user settings")
        }

        // If no settings exist, create them
        if (!data || data.length === 0) {
          return await createUserSettings(userId)
        }

        // Return the first settings if multiple exist
        return data && data.length > 0 ? (data[0] as UserSettings) : null
      } catch (error) {
        return handleSupabaseError(error, "fetchUserSettings")
      }
    },
    [createUserSettings],
  )

  // Fetch user subscription
  const fetchUserSubscription = useCallback(
    async (userId: string) => {
      try {
        // In production, we might want to skip this if it's causing issues
        if (isProduction) {
          console.log("Skipping subscription fetch in production to avoid potential issues")
          return { subscription: null, plan: null }
        }

        const { data: subscription, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .single()

        if (subscriptionError) {
          if (subscriptionError.code !== "PGRST116") {
            // PGRST116 is "no rows returned" error
            handleSupabaseError(subscriptionError, "fetching subscription")
          }
          return { subscription: null, plan: null }
        }

        // Fetch the subscription plan details
        const { data: plan, error: planError } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("id", subscription.plan_id)
          .single()

        if (planError) {
          handleSupabaseError(planError, "fetching subscription plan")
          return { subscription, plan: null }
        }

        return {
          subscription: subscription as UserSubscription,
          plan: plan as SubscriptionPlan,
        }
      } catch (error) {
        handleSupabaseError(error, "fetchUserSubscription")
        return { subscription: null, plan: null }
      }
    },
    [isProduction],
  )

  // Fetch usage tracking
  const fetchUsageTracking = useCallback(
    async (userId: string) => {
      try {
        // In production, we might want to skip this if it's causing issues
        if (isProduction) {
          console.log("Skipping usage tracking fetch in production to avoid potential issues")
          return []
        }

        const { data, error } = await supabase
          .from("usage_tracking")
          .select("*")
          .eq("user_id", userId)
          .gte("period_end", new Date().toISOString())

        if (error) {
          console.warn("Error fetching usage tracking:", error.message)
          return [] // Return empty array instead of null
        }

        return data as UsageTracking[]
      } catch (error) {
        console.warn("Exception in fetchUsageTracking:", error)
        return [] // Return empty array on exception
      }
    },
    [isProduction],
  )

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!state.user) return

    try {
      const profile = await fetchUserProfile(state.user.id, state.user.email)
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

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    if (!state.user) return

    try {
      const { subscription, plan } = await fetchUserSubscription(state.user.id)

      // Try to fetch usage data, but don't let it break the flow if it fails
      let usage = []
      try {
        usage = (await fetchUsageTracking(state.user.id)) || []
      } catch (fetchError) {
        console.warn("Could not fetch usage tracking, continuing with empty data:", fetchError)
      }

      setState((prev) => ({
        ...prev,
        subscription,
        subscriptionPlan: plan,
        usage,
      }))
    } catch (error) {
      console.error("Error refreshing subscription:", error)
      // Still update the state with what we have
      setState((prev) => ({
        ...prev,
        subscription: null,
        subscriptionPlan: null,
        usage: [],
      }))
    }
  }, [state.user, fetchUserSubscription, fetchUsageTracking])

  // Check if user has access to a specific feature
  const checkFeatureAccess = useCallback(
    (feature: SubscriptionFeature): boolean => {
      // If no subscription plan, default to free tier features
      if (!state.subscriptionPlan) {
        // Free tier only has access to basic trades
        return feature === "basic_trades"
      }

      // Check if the feature is included in the subscription plan
      const features = state.subscriptionPlan.features as Record<string, boolean>
      return !!features[feature]
    },
    [state.subscriptionPlan],
  )

  // Get remaining usage for a resource type
  const getRemainingUsage = useCallback(
    (resourceType: "trades" | "ai_queries" | "storage"): number => {
      if (!state.usage || !state.subscriptionPlan) return 0

      const usageRecord = state.usage.find((u) => u?.resource_type === resourceType)

      if (!usageRecord) return 0

      let limit = 0
      switch (resourceType) {
        case "trades":
          limit = state.subscriptionPlan.trade_limit || 0
          break
        case "ai_queries":
          limit = state.subscriptionPlan.ai_query_limit || 0
          break
        // Add other resource types as needed
      }

      return Math.max(0, limit - (usageRecord.current_usage || 0))
    },
    [state.usage, state.subscriptionPlan],
  )

  // Get usage percentage for a resource type
  const getUsagePercentage = useCallback(
    (resourceType: "trades" | "ai_queries" | "storage"): number => {
      if (!state.usage || !state.subscriptionPlan) return 0

      const usageRecord = state.usage.find((u) => u?.resource_type === resourceType)

      if (!usageRecord) return 0

      let limit = 0
      switch (resourceType) {
        case "trades":
          limit = state.subscriptionPlan.trade_limit || 0
          break
        case "ai_queries":
          limit = state.subscriptionPlan.ai_query_limit || 0
          break
        // Add other resource types as needed
      }

      if (limit === 0) return 0
      return Math.min(100, ((usageRecord.current_usage || 0) / limit) * 100)
    },
    [state.usage, state.subscriptionPlan],
  )

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
        try {
          // Fetch user data with error handling
          const profile = await fetchUserProfile(session.user.id, session.user.email)

          // Add delay between requests to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 300))
          const settings = await fetchUserSettings(session.user.id)

          // In production, we might want to skip subscription fetching if it's causing issues
          let subscription = null
          let plan = null
          let usage = []

          if (!isProduction) {
            await new Promise((resolve) => setTimeout(resolve, 300))
            const subData = await fetchUserSubscription(session.user.id)
            subscription = subData.subscription
            plan = subData.plan

            // Try to fetch usage data, but don't let it break the flow if it fails
            try {
              await new Promise((resolve) => setTimeout(resolve, 300))
              usage = (await fetchUsageTracking(session.user.id)) || []
            } catch (fetchError) {
              console.warn("Could not fetch usage tracking, continuing with empty data:", fetchError)
            }
          }

          setState({
            user: session.user,
            session,
            profile,
            settings,
            subscription,
            subscriptionPlan: plan,
            usage,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.error("Error fetching user data:", error)
          setState({
            user: session.user,
            session,
            profile: null,
            settings: null,
            subscription: null,
            subscriptionPlan: null,
            usage: [],
            isLoading: false,
            error: "Error loading user data",
          })
        }
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          settings: null,
          subscription: null,
          subscriptionPlan: null,
          usage: null,
          isLoading: false,
          error: null,
        })
      }

      setIsInitialLoad(false)
    })

    // Set up auth state change listener
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event)

        // Prevent duplicate sign-in notifications
        if (event === "SIGNED_IN" && lastSignInEvent === "SIGNED_IN") {
          console.log("Ignoring duplicate SIGNED_IN event")
          return
        }

        // Update last event
        setLastSignInEvent(event)

        if (session?.user) {
          try {
            // Skip fetching data on initial load as it's already handled above
            if (isInitialLoad && event === "INITIAL_SESSION") {
              console.log("Skipping duplicate data fetch on initial load")
              return
            }

            // Fetch user data with delays between requests
            const profile = await fetchUserProfile(session.user.id, session.user.email)

            await new Promise((resolve) => setTimeout(resolve, 300))
            const settings = await fetchUserSettings(session.user.id)

            // In production, we might want to skip subscription fetching if it's causing issues
            let subscription = null
            let plan = null
            let usage = []

            if (!isProduction) {
              await new Promise((resolve) => setTimeout(resolve, 300))
              const subData = await fetchUserSubscription(session.user.id)
              subscription = subData.subscription
              plan = subData.plan

              // Try to fetch usage data, but don't let it break the flow if it fails
              try {
                await new Promise((resolve) => setTimeout(resolve, 300))
                usage = (await fetchUsageTracking(session.user.id)) || []
              } catch (fetchError) {
                console.warn("Could not fetch usage tracking, continuing with empty data:", fetchError)
              }
            }

            setState({
              user: session.user,
              session,
              profile,
              settings,
              subscription,
              subscriptionPlan: plan,
              usage,
              isLoading: false,
              error: null,
            })

            // Handle specific auth events - only show toast on actual sign in, not session refresh
            if (event === "SIGNED_IN" && !isInitialLoad) {
              console.log("User signed in:", session.user.email)
              toast({
                title: "Signed in successfully",
                description: `Welcome${profile?.display_name ? `, ${profile.display_name}` : ""}!`,
              })

              // In production, use a short delay before refresh to ensure session is properly set
              if (isProduction) {
                console.log("Production environment detected, adding delay before refresh")
                setTimeout(() => {
                  router.refresh()
                }, 1000)
              } else {
                router.refresh()
              }
            }
          } catch (error) {
            console.error("Error fetching user data on auth change:", error)
            setState({
              user: session.user,
              session,
              profile: null,
              settings: null,
              subscription: null,
              subscriptionPlan: null,
              usage: [],
              isLoading: false,
              error: "Error loading user data",
            })
          }
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            settings: null,
            subscription: null,
            subscriptionPlan: null,
            usage: null,
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
  }, [
    fetchUserProfile,
    fetchUserSettings,
    fetchUserSubscription,
    fetchUsageTracking,
    router,
    toast,
    isInitialLoad,
    lastSignInEvent,
    isProduction,
  ])

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

        // Add special headers for production environment
        const options = isProduction
          ? {
              auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
              },
            }
          : undefined

        const { data, error } = await supabase.auth.signInWithPassword(
          {
            email,
            password,
          },
          options,
        )

        if (error) {
          throw error
        }

        console.log("Sign in successful:", data.user?.email)

        // In production, add a small delay to ensure session is properly set
        if (isProduction) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

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
    [toast, isProduction],
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
        const { error } = await supabase
          .from("user_profiles")
          .update({ ...profile, updated_at: new Date().toISOString() })
          .eq("id", state.user.id)

        if (error) throw error

        // Refresh profile data
        const updatedProfile = await fetchUserProfile(state.user.id, state.user.email)
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
        const { error } = await supabase
          .from("user_settings")
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq("id", state.user.id)

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
          .update({
            avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", state.user.id)

        if (updateError) throw updateError

        // Refresh profile data
        const updatedProfile = await fetchUserProfile(state.user.id, state.user.email)
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
    refreshSubscription,
    checkFeatureAccess,
    getRemainingUsage,
    getUsagePercentage,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
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
      subscription: null,
      subscriptionPlan: null,
      usage: null,
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
      refreshSubscription: async () => {},
      checkFeatureAccess: () => false,
      getRemainingUsage: () => 0,
      getUsagePercentage: () => 0,
    }
  }
  return context
}
