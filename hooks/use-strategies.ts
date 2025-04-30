"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { useToast } from "@/components/ui/use-toast"

export type Strategy = {
  id: string
  name: string
  description: string | null
  category: string
  timeframes: string[] | null
  market_conditions: string[] | null
  setup_image: string | null
  is_active: boolean
  win_rate: number | null
  profit_factor: number | null
  avg_r_multiple: number | null
  usage_count: number | null
  compliance_score: number | null
  created_at: string
  updated_at: string
  rules: StrategyRule[]
}

export type StrategyRule = {
  id: string
  strategy_id: string
  description: string
  category: string
  priority: number
  is_required: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export function useStrategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { toast } = useToast()

  // Create Supabase client only once
  const supabase = createClientComponentClient<Database>()

  const fetchStrategies = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if we have a valid Supabase URL and key
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Supabase URL or anon key is missing. Using mock data.")
        // Provide mock data for development/testing
        setStrategies(getMockStrategies())
        return
      }

      // Get current user session to ensure we're authenticated
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        throw new Error(`Authentication error: ${sessionError.message}`)
      }

      if (!session) {
        console.warn("No active session found. Using mock data.")
        setStrategies(getMockStrategies())
        return
      }

      // Fetch strategies with error handling
      const { data: strategiesData, error: strategiesError } = await supabase
        .from("strategies")
        .select("*")
        .order("name")

      if (strategiesError) {
        console.error("Error fetching strategies:", strategiesError)
        throw new Error(strategiesError.message)
      }

      // If no strategies found, return empty array
      if (!strategiesData || strategiesData.length === 0) {
        setStrategies([])
        return
      }

      // Fetch rules for each strategy with improved error handling
      const strategiesWithRules = await Promise.all(
        strategiesData.map(async (strategy) => {
          try {
            const { data: rulesData, error: rulesError } = await supabase
              .from("rules")
              .select("*")
              .eq("strategy_id", strategy.id)
              .order("order_index")

            if (rulesError) {
              console.error(`Error fetching rules for strategy ${strategy.id}:`, rulesError)
              // Continue with empty rules rather than failing completely
              return {
                ...strategy,
                rules: [],
                performance: {
                  win_rate: strategy.win_rate || 0,
                  profit_factor: strategy.profit_factor || 0,
                  avg_r_multiple: strategy.avg_r_multiple || 0,
                  usage_count: strategy.usage_count || 0,
                },
              }
            }

            return {
              ...strategy,
              rules: rulesData || [],
              performance: {
                win_rate: strategy.win_rate || 0,
                profit_factor: strategy.profit_factor || 0,
                avg_r_multiple: strategy.avg_r_multiple || 0,
                usage_count: strategy.usage_count || 0,
              },
            }
          } catch (err) {
            console.error(`Error processing strategy ${strategy.id}:`, err)
            // Return the strategy without rules rather than failing completely
            return {
              ...strategy,
              rules: [],
              performance: {
                win_rate: strategy.win_rate || 0,
                profit_factor: strategy.profit_factor || 0,
                avg_r_multiple: strategy.avg_r_multiple || 0,
                usage_count: strategy.usage_count || 0,
              },
            }
          }
        }),
      )

      setStrategies(strategiesWithRules)
    } catch (err: any) {
      console.error("Error in fetchStrategies:", err)
      setError(`Error fetching strategies: ${err.message}`)

      // Show toast only on final retry
      if (retryCount >= 2) {
        toast({
          title: "Error",
          description: `Failed to load strategies: ${err.message}`,
          variant: "destructive",
        })
      }

      // Retry logic (max 3 attempts)
      if (retryCount < 3) {
        console.log(`Retrying fetch (attempt ${retryCount + 1}/3)...`)
        setTimeout(
          () => {
            setRetryCount((prev) => prev + 1)
          },
          1000 * (retryCount + 1),
        ) // Exponential backoff
      } else {
        // After all retries, use mock data
        console.warn("All retries failed. Using mock data.")
        setStrategies(getMockStrategies())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStrategies()
  }, [retryCount])

  const createStrategy = async (strategy: Partial<Strategy>) => {
    try {
      setLoading(true)

      // Get current user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("You must be logged in to create a strategy")
      }

      // Use the RPC function we created
      const { data, error } = await supabase.rpc("create_strategy", {
        user_id: session.user.id,
        name: strategy.name || "New Strategy",
        description: strategy.description || "",
        category: strategy.category || "General",
        is_active: strategy.is_active !== undefined ? strategy.is_active : true,
        timeframes: strategy.timeframes || [],
        market_conditions: strategy.market_conditions || [],
      })

      if (error) throw new Error(error.message)

      // Refresh strategies
      await fetchStrategies()

      return data
    } catch (err: any) {
      console.error("Error creating strategy:", err)
      toast({
        title: "Error",
        description: `Failed to create strategy: ${err.message}`,
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateStrategy = async (id: string, updates: Partial<Strategy>) => {
    try {
      setLoading(true)

      // Update strategy
      const { error } = await supabase.from("strategies").update(updates).eq("id", id)

      if (error) throw new Error(error.message)

      // Refresh strategies
      await fetchStrategies()

      return true
    } catch (err: any) {
      console.error("Error updating strategy:", err)
      toast({
        title: "Error",
        description: `Failed to update strategy: ${err.message}`,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteStrategy = async (id: string) => {
    try {
      setLoading(true)

      // Delete strategy
      const { error } = await supabase.from("strategies").delete().eq("id", id)

      if (error) throw new Error(error.message)

      // Refresh strategies
      await fetchStrategies()

      return true
    } catch (err: any) {
      console.error("Error deleting strategy:", err)
      toast({
        title: "Error",
        description: `Failed to delete strategy: ${err.message}`,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // Mock data for development/testing
  const getMockStrategies = (): Strategy[] => {
    return [
      {
        id: "mock-1",
        name: "Breakout Strategy",
        description: "A strategy for trading breakouts from consolidation patterns",
        category: "Momentum",
        timeframes: ["1h", "4h", "1d"],
        market_conditions: ["Trending"],
        setup_image: null,
        is_active: true,
        win_rate: 65,
        profit_factor: 2.3,
        avg_r_multiple: 1.8,
        usage_count: 24,
        compliance_score: 85,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rules: [
          {
            id: "rule-1",
            strategy_id: "mock-1",
            description: "Price breaks above resistance with increased volume",
            category: "Entry",
            priority: 1,
            is_required: true,
            order_index: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "rule-2",
            strategy_id: "mock-1",
            description: "RSI is above 50",
            category: "Confirmation",
            priority: 2,
            is_required: false,
            order_index: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: "mock-2",
        name: "Pullback Strategy",
        description: "A strategy for trading pullbacks in trending markets",
        category: "Trend Following",
        timeframes: ["15m", "1h", "4h"],
        market_conditions: ["Trending"],
        setup_image: null,
        is_active: true,
        win_rate: 58,
        profit_factor: 1.9,
        avg_r_multiple: 1.5,
        usage_count: 18,
        compliance_score: 78,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rules: [
          {
            id: "rule-3",
            strategy_id: "mock-2",
            description: "Price pulls back to moving average",
            category: "Entry",
            priority: 1,
            is_required: true,
            order_index: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
    ]
  }

  return {
    strategies,
    loading,
    error,
    fetchStrategies,
    createStrategy,
    updateStrategy,
    deleteStrategy,
  }
}
