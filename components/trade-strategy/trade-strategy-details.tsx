"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Strategy, Rule } from "@/types/database"

interface TradeStrategyDetailsProps {
  tradeId: string
}

export function TradeStrategyDetails({ tradeId }: TradeStrategyDetailsProps) {
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchStrategyDetails = async () => {
      try {
        setLoading(true)

        // Fetch trade details
        const { data: tradeData, error: tradeError } = await supabase
          .from("trades")
          .select(`
            strategy_id,
            strategies (
              id,
              name,
              description,
              category
            )
          `)
          .eq("id", tradeId)
          .single()

        if (tradeError) throw tradeError

        if (!tradeData?.strategy_id) {
          setLoading(false)
          return
        }

        // Fetch strategy
        const { data: strategyData, error: strategyDetailsError } = await supabase
          .from("strategies")
          .select("*")
          .eq("id", tradeData.strategy_id)
          .single()

        if (strategyDetailsError) throw strategyDetailsError

        setStrategy(strategyData)

        // Fetch rules
        const { data: rulesData, error: rulesError } = await supabase
          .from("rules")
          .select("*")
          .eq("strategy_id", tradeData.strategy_id)
          .order("order_index")

        if (rulesError) throw rulesError
        setRules(rulesData || [])
      } catch (error) {
        console.error("Error fetching strategy details:", error)
        toast({
          title: "Error",
          description: "Failed to load strategy details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStrategyDetails()
  }, [tradeId, supabase, toast])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg border-border/50">
        <p className="text-muted-foreground">No strategy associated with this trade</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Strategy: {strategy.name}</h3>
      <p className="text-sm text-muted-foreground">{strategy.description}</p>

      <div className="space-y-3">
        <h4 className="font-medium text-sm">Rules</h4>
        {rules.length > 0 ? (
          <ul className="list-disc list-inside space-y-1">
            {rules.map((rule) => (
              <li key={rule.id} className="text-sm">
                {rule.description}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No rules defined for this strategy</p>
        )}
      </div>
    </div>
  )
}
