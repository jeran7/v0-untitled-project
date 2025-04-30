"use client"

import { useEffect } from "react"
import { setupSubscriptionBlocker } from "@/lib/subscription-blocker"

export function SubscriptionBlocker() {
  useEffect(() => {
    setupSubscriptionBlocker()
  }, [])

  return null // This component doesn't render anything
}
