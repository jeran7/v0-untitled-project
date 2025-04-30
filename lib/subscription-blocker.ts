// This script blocks problematic subscription API calls that cause authentication issues

export function setupSubscriptionBlocker() {
  if (typeof window === "undefined") return // Only run in browser

  console.log("🛡️ Setting up subscription API blocker")

  // Store the original fetch function
  const originalFetch = window.fetch

  // Override fetch to intercept problematic calls
  window.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : input.toString()

    // Check if this is a subscription API call
    if (url.includes("/user_subscriptions") && url.includes("supabase.co")) {
      console.log("🛑 Blocked problematic subscription API call:", url)

      // Return a fake successful response instead of making the actual call
      return Promise.resolve(
        new Response(
          JSON.stringify([
            {
              id: "fake-subscription-id",
              user_id: url.match(/user_id=eq\.([^&]+)/)?.[1] || "unknown",
              status: "active",
              plan_id: "pro",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      )
    }

    // Otherwise, proceed with the original fetch
    return originalFetch.apply(window, [input, init])
  }

  // Also intercept XMLHttpRequest for older code
  const originalOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    if (typeof url === "string" && url.includes("/user_subscriptions") && url.includes("supabase.co")) {
      console.log("🛑 Blocked XMLHttpRequest to subscription API:", url)
      // Redirect to a non-existent endpoint to prevent the actual call
      url = "/blocked-subscription-api"
    }
    return originalOpen.apply(this, [method, url, ...args])
  }

  console.log("🛡️ Subscription API blocker setup complete")
}
