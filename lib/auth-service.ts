import { supabase } from "./supabase/client"

// Simple service to handle authentication without complex state management
export const AuthService = {
  // Get current session
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data.session
    } catch (error) {
      console.error("Error getting session:", error)
      return null
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const session = await AuthService.getSession()
      return !!session
    } catch (error) {
      console.error("Error checking authentication:", error)
      return false
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      // Development bypass for testing (remove in production)
      if (process.env.NODE_ENV === "development" && email === "demo@example.com" && password === "demo123") {
        console.log("Using development bypass authentication")
        return {
          success: true,
          user: {
            id: "dev-user-id",
            email: "demo@example.com",
            user_metadata: { name: "Demo User" },
          },
          session: {
            access_token: "dev-token",
            expires_at: Date.now() + 3600000,
          },
        }
      }

      // First sign out to clear any existing session
      await supabase.auth.signOut()

      console.log("Attempting Supabase authentication...")

      // Sign in with new credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Supabase auth error details:", error)
        throw error
      }

      console.log("Authentication successful:", data.user?.email)

      // Store a backup of authentication state
      if (data.session) {
        try {
          localStorage.setItem(
            "auth-backup",
            JSON.stringify({
              authenticated: true,
              timestamp: Date.now(),
              user: data.user.email,
            }),
          )
        } catch (e) {
          console.warn("Could not store auth backup", e)
        }
      }

      return { success: true, user: data.user, session: data.session }
    } catch (error: any) {
      console.error("Sign in error:", error)

      // Provide more specific error messages
      if (error.message?.includes("Invalid login credentials")) {
        return { success: false, error: "Invalid email or password. Please try again." }
      }

      // Handle network errors
      if (error.message?.includes("fetch") || error.message?.includes("network")) {
        return { success: false, error: "Network error. Please check your connection and try again." }
      }

      return { success: false, error: error.message || "Authentication failed" }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear backup auth state
      try {
        localStorage.removeItem("auth-backup")
      } catch (e) {
        console.warn("Could not clear auth backup", e)
      }

      return { success: true }
    } catch (error: any) {
      console.error("Sign out error:", error)
      return { success: false, error: error.message }
    }
  },

  // Get user profile from backup if session fails
  getBackupAuthState: () => {
    try {
      const backup = localStorage.getItem("auth-backup")
      if (!backup) return null

      const data = JSON.parse(backup)

      // Check if backup is recent (less than 24 hours)
      const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000

      if (data.authenticated && isRecent) {
        return { authenticated: true, user: data.user }
      }

      return null
    } catch (e) {
      console.warn("Could not get auth backup", e)
      return null
    }
  },
}
