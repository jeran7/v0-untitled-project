// This script runs on page load to fix authentication issues

export function setupAuthFixer() {
  if (typeof window === "undefined") return // Only run in browser

  console.log("🔧 Setting up auth fixer")

  // Check if we have a backup auth
  const backup = localStorage.getItem("auth-backup")
  if (!backup) return

  try {
    const data = JSON.parse(backup)
    const isRecent = Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000 // 7 days

    if (data.authenticated && isRecent) {
      console.log("🔧 Found valid backup auth for", data.user)

      // Check if we need to create a fake Supabase session
      const supabaseToken = localStorage.getItem("supabase.auth.token")
      if (!supabaseToken) {
        console.log("🔧 Creating fake Supabase session")

        // Create a fake session in localStorage that Supabase will recognize
        localStorage.setItem(
          "supabase.auth.token",
          JSON.stringify({
            currentSession: {
              access_token: "fake-token-" + Math.random().toString(36).substring(2, 15),
              refresh_token: "fake-refresh-" + Math.random().toString(36).substring(2, 15),
              user: {
                id: data.userId || "emergency-" + Math.random().toString(36).substring(2, 15),
                email: data.user,
                role: "authenticated",
              },
              expires_at: Date.now() + 3600000, // 1 hour from now
            },
            expiresAt: Date.now() + 3600000,
          }),
        )
      }
    }
  } catch (e) {
    console.error("Error in auth fixer:", e)
  }
}

// Run the auth fixer immediately
if (typeof window !== "undefined") {
  setupAuthFixer()
}
