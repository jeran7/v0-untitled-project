"use client"

import { useEffect } from "react"
import { setupAuthFixer } from "@/lib/auth-fixer"

export function AuthFixer() {
  useEffect(() => {
    setupAuthFixer()
  }, [])

  return null // This component doesn't render anything
}
