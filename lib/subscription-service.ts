import { supabase } from "./supabase/client"
import type { SubscriptionPlan, UserSubscription } from "@/types/database"

export const SubscriptionService = {
  /**
   * Get the active subscription for a user
   */
  getUserSubscription: async (userId: string): Promise<UserSubscription | null> => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .single()

      if (error) {
        console.error("Error fetching user subscription:", error)
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
      const { data, error } = await supabase.from("subscription_plans").select("*").eq("id", planId).single()

      if (error) {
        console.error("Error fetching subscription plan:", error)
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
        .from("trades")
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
