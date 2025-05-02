import { supabase } from "./supabase/client"
import type { SubscriptionPlan, UserSubscription } from "@/types/database"

// Fix table name constants to prevent typos
const TABLES = {
  USER_SUBSCRIPTIONS: "user_subscriptions", // Ensure full table name is used
  SUBSCRIPTION_PLANS: "subscription_plans",
  TRADES: "trades",
}

export const SubscriptionService = {
  /**
   * Get the active subscription for a user
   */
  getUserSubscription: async (userId: string): Promise<UserSubscription | null> => {
    try {
      // Use the constant to prevent typos
      const { data, error } = await supabase
        .from(TABLES.USER_SUBSCRIPTIONS) // Use constant instead of string literal
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .single()

      if (error) {
        console.error("Error fetching user subscription:", error)
        // Return a dummy subscription for development to prevent login issues
        if (process.env.NODE_ENV === "development") {
          console.log("Using dummy subscription data for development")
          return {
            id: "dummy-subscription-id",
            user_id: userId,
            plan_id: "550e8400-e29b-41d4-a716-446655440000",
            status: "active",
            current_period_start: new Date(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            is_annual: false,
            created_at: new Date(),
            updated_at: new Date(),
          } as UserSubscription
        }
        return null
      }

      return data
    } catch (error) {
      console.error("Exception in getUserSubscription:", error)
      return null
    }
  },

  /**
   * Get subscription plan details
   */
  getSubscriptionPlan: async (planId: string): Promise<SubscriptionPlan | null> => {
    try {
      const { data, error } = await supabase.from(TABLES.SUBSCRIPTION_PLANS).select("*").eq("id", planId).single()

      if (error) {
        console.error("Error fetching subscription plan:", error)
        // Return a dummy plan for development to prevent login issues
        if (process.env.NODE_ENV === "development") {
          console.log("Using dummy plan data for development")
          return {
            id: planId,
            name: "Pro Plan",
            price_monthly: 29.99,
            price_annual: 299.99,
            trade_limit: 1000,
            ai_query_limit: 100,
            features: { advanced_analytics: true, unlimited_storage: true },
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          } as SubscriptionPlan
        }
        return null
      }

      return data
    } catch (error) {
      console.error("Exception in getSubscriptionPlan:", error)
      return null
    }
  },

  /**
   * Get user subscription with plan details
   */
  getUserSubscriptionWithPlan: async (userId: string) => {
    try {
      // For development, bypass subscription check
      if (process.env.NODE_ENV === "development") {
        console.log("Development mode: Bypassing subscription check")
        return {
          hasActiveSubscription: true,
          subscription: {
            id: "dev-subscription",
            user_id: userId,
            plan_id: "dev-plan-id",
            status: "active",
          },
          plan: {
            id: "dev-plan-id",
            name: "Developer Plan",
            trade_limit: 1000,
          },
          error: null,
        }
      }

      const subscription = await SubscriptionService.getUserSubscription(userId)

      if (!subscription) {
        // Handle case where user has no active subscription
        return {
          hasActiveSubscription: false,
          subscription: null,
          plan: null,
          error: null,
        }
      }

      const plan = await SubscriptionService.getSubscriptionPlan(subscription.plan_id)

      return {
        hasActiveSubscription: true,
        subscription,
        plan,
        error: null,
      }
    } catch (error) {
      console.error("Error getting subscription with plan:", error)
      return {
        hasActiveSubscription: false,
        subscription: null,
        plan: null,
        error: "Failed to fetch subscription information",
      }
    }
  },

  /**
   * Check if user has reached their trade limit
   */
  checkTradeLimit: async (
    userId: string,
  ): Promise<{
    canAddTrade: boolean
    currentCount: number
    limit: number | null
    message: string | null
  }> => {
    try {
      // For development, always allow trades
      if (process.env.NODE_ENV === "development") {
        return {
          canAddTrade: true,
          currentCount: 0,
          limit: 1000,
          message: null,
        }
      }

      // Get subscription info
      const { subscription, plan, hasActiveSubscription } =
        await SubscriptionService.getUserSubscriptionWithPlan(userId)

      if (!hasActiveSubscription || !plan) {
        return {
          canAddTrade: false,
          currentCount: 0,
          limit: 0,
          message: "No active subscription found",
        }
      }

      // Count user's trades
      const { count, error } = await supabase
        .from(TABLES.TRADES)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      if (error) {
        console.error("Error counting trades:", error)
        return {
          canAddTrade: true, // Fail open to avoid blocking users
          currentCount: 0,
          limit: plan.trade_limit,
          message: "Error checking trade limit",
        }
      }

      const tradeCount = count || 0
      const canAddTrade = tradeCount < plan.trade_limit

      return {
        canAddTrade,
        currentCount: tradeCount,
        limit: plan.trade_limit,
        message: canAddTrade ? null : `You've reached your limit of ${plan.trade_limit} trades`,
      }
    } catch (error) {
      console.error("Exception in checkTradeLimit:", error)
      return {
        canAddTrade: true, // Fail open to avoid blocking users
        currentCount: 0,
        limit: null,
        message: "Error checking trade limit",
      }
    }
  },
}
