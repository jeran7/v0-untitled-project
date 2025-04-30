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
      // First sign out to clear any existing session
      await supabase.auth.signOut()

      // Sign in with new credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

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
      return { success: false, error: error.message }
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
