"use client"

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import type { AuthContextType, AuthState } from "@/types/auth"

const initialState: AuthState = {
  user: null,
  session: null,
  profile: null,
  settings: null,
  subscription: null,
  subscriptionPlan: null,
  usage: null,
  isLoading: true,
  error: null,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Simple error handler to avoid crashing the app
const safeErrorHandler = (error: any, operation: string): null => {
  try {
    console.error(`Error during ${operation}:`, error)
  } catch (e) {
    // Silent fallback if console is broken
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)
  const { toast } = useToast()
  const router = useRouter()
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [lastSignInEvent, setLastSignInEvent] = useState<string | null>(null)

  // Initial session check and setup auth listener
  useEffect(() => {
    let isMounted = true
    setState((prev) => ({ ...prev, isLoading: true }))

    // Get current session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error)
        if (isMounted) {
          setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
        }
        return
      }

      if (session?.user && isMounted) {
        setState({
          user: session.user,
          session,
          profile: null, // We'll fetch these later
          settings: null,
          subscription: null,
          subscriptionPlan: null,
          usage: null,
          isLoading: false,
          error: null,
        })
      } else if (isMounted) {
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
        if (!isMounted) return

        console.log("Auth state changed:", event)

        // Prevent duplicate sign-in notifications
        if (event === "SIGNED_IN" && lastSignInEvent === "SIGNED_IN") {
          console.log("Ignoring duplicate SIGNED_IN event")
          return
        }

        // Update last event
        setLastSignInEvent(event)

        if (session?.user) {
          setState((prev) => ({
            ...prev,
            user: session.user,
            session,
            isLoading: false,
            error: null,
          }))

          // Handle specific auth events
          if (event === "SIGNED_IN" && !isInitialLoad) {
            console.log("User signed in:", session.user.email)
            toast({
              title: "Signed in successfully",
              description: `Welcome!`,
            })
            router.refresh()
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
            router.push("/auth/login")
          }
        }
      })

      return () => {
        isMounted = false
        subscription.unsubscribe()
      }
    } catch (err) {
      console.error("Error setting up auth listener:", err)
      if (isMounted) {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    return () => {
      isMounted = false
    }
  }, [router, toast, isInitialLoad, lastSignInEvent])

  // Sign in with email and password
  const signIn = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        console.log("Signing in user:", email)

        // First, clear any existing session
        await supabase.auth.signOut()

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw error
        }

        // Auth state listener will handle session update
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

  // Simplified auth context with only essential functions
  const value: AuthContextType = {
    ...state,
    signIn,
    signOut,
    signUp: async () => ({ success: false, error: "Not implemented" }),
    signInWithGoogle: async () => {},
    signInWithGithub: async () => {},
    resetPassword: async () => ({ success: false, error: "Not implemented" }),
    updatePassword: async () => ({ success: false, error: "Not implemented" }),
    updateProfile: async () => ({ success: false, error: "Not implemented" }),
    updateSettings: async () => ({ success: false, error: "Not implemented" }),
    uploadAvatar: async () => ({ success: false, error: "Not implemented" }),
    deleteAccount: async () => ({ success: false, error: "Not implemented" }),
    refreshProfile: async () => {},
    refreshSettings: async () => {},
    refreshSubscription: async () => {},
    checkFeatureAccess: () => false,
    getRemainingUsage: () => 0,
    getUsagePercentage: () => 0,
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
