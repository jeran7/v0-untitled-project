"use client"

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

type AuthState = {
  user: any
  session: any
  isLoading: boolean
  error: string | null
}

type AuthContextType = AuthState & {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
}

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  error: null,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create a backup of authentication in localStorage
const saveAuthBackup = (user: any) => {
  try {
    localStorage.setItem(
      "auth-backup",
      JSON.stringify({
        authenticated: true,
        timestamp: Date.now(),
        user: user?.email,
        userId: user?.id,
      }),
    )
  } catch (e) {
    console.warn("Could not save auth backup", e)
  }
}

// Get auth backup from localStorage
const getAuthBackup = () => {
  try {
    const backup = localStorage.getItem("auth-backup")
    if (!backup) return null

    const data = JSON.parse(backup)
    const isRecent = Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000 // 7 days

    if (data.authenticated && isRecent) {
      return data
    }
    return null
  } catch (e) {
    console.warn("Could not get auth backup", e)
    return null
  }
}

export function SimplifiedAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)
  const { toast } = useToast()
  const router = useRouter()

  // Initial session check
  useEffect(() => {
    const checkSession = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }))

        // Try to get session from Supabase
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.warn("Error getting session:", error)
          // Check for backup auth
          const backup = getAuthBackup()
          if (backup) {
            console.log("Using backup auth:", backup.user)
            setState({
              user: { email: backup.user, id: backup.userId },
              session: { user: { email: backup.user, id: backup.userId } },
              isLoading: false,
              error: null,
            })
            return
          }

          setState({ ...initialState, isLoading: false, error: error.message })
          return
        }

        if (data.session) {
          // Save backup
          saveAuthBackup(data.session.user)

          setState({
            user: data.session.user,
            session: data.session,
            isLoading: false,
            error: null,
          })
        } else {
          // Check for backup auth
          const backup = getAuthBackup()
          if (backup) {
            console.log("Using backup auth:", backup.user)
            setState({
              user: { email: backup.user, id: backup.userId },
              session: { user: { email: backup.user, id: backup.userId } },
              isLoading: false,
              error: null,
            })
            return
          }

          setState({ ...initialState, isLoading: false })
        }
      } catch (e) {
        console.error("Error in checkSession:", e)
        setState({ ...initialState, isLoading: false, error: "Failed to check session" })
      }
    }

    checkSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      if (session) {
        // Save backup
        saveAuthBackup(session.user)

        setState({
          user: session.user,
          session,
          isLoading: false,
          error: null,
        })

        if (event === "SIGNED_IN") {
          toast({
            title: "Signed in successfully",
            description: `Welcome, ${session.user.email}!`,
          })
        }
      } else {
        if (event === "SIGNED_OUT") {
          setState({ ...initialState, isLoading: false })
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          })
          router.push("/auth/login")
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [toast, router])

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // First sign out to clear any existing session
      await supabase.auth.signOut()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Save backup
      saveAuthBackup(data.user)

      setState({
        user: data.user,
        session: data.session,
        isLoading: false,
        error: null,
      })

      return { success: true }
    } catch (error: any) {
      console.error("Sign in error:", error)
      setState((prev) => ({ ...prev, error: error.message, isLoading: false }))

      return { success: false, error: error.message }
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      await supabase.auth.signOut()

      // Clear backup
      localStorage.removeItem("auth-backup")

      setState({ ...initialState, isLoading: false })
    } catch (error: any) {
      console.error("Sign out error:", error)
      setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
    }
  }, [])

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // The redirect will happen automatically
    } catch (error: any) {
      console.error("Google sign in error:", error)
      setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
    }
  }, [])

  // Sign in with GitHub
  const signInWithGithub = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // The redirect will happen automatically
    } catch (error: any) {
      console.error("GitHub sign in error:", error)
      setState((prev) => ({ ...prev, error: error.message, isLoading: false }))
    }
  }, [])

  const value: AuthContextType = {
    ...state,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithGithub,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useSimplifiedAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useSimplifiedAuth must be used within a SimplifiedAuthProvider")
  }
  return context
}
