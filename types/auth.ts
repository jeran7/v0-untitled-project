import type { Session, User } from "@supabase/supabase-js"
import type { UserProfile, UserSettings, UserSubscription, SubscriptionPlan, UsageTracking } from "./database"

export interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  settings: UserSettings | null
  subscription: UserSubscription | null
  subscriptionPlan: SubscriptionPlan | null
  usage: UsageTracking[] | null
  isLoading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (profile: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
  updateSettings: (settings: Partial<UserSettings>) => Promise<{ success: boolean; error?: string }>
  uploadAvatar: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>
  deleteAccount: () => Promise<{ success: boolean; error?: string }>
  refreshProfile: () => Promise<void>
  refreshSettings: () => Promise<void>
  refreshSubscription: () => Promise<void>
  checkFeatureAccess: (feature: SubscriptionFeature) => boolean
  getRemainingUsage: (resourceType: "trades" | "ai_queries" | "storage") => number
  getUsagePercentage: (resourceType: "trades" | "ai_queries" | "storage") => number
}

export type SubscriptionFeature =
  | "basic_trades"
  | "advanced_trades"
  | "ai_analysis"
  | "unlimited_screenshots"
  | "strategy_playbook"
  | "performance_metrics"
  | "export_data"
  | "api_access"
  | "priority_support"
