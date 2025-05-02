"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth/auth-provider"
import type { Database } from "@/types/database"

export type TradeSortField = "entry_date" | "symbol" | "pnl" | "status"
export type SortDirection = "asc" | "desc"

export interface Trade {
  id: string
  user_id: string
  symbol: string
  direction: "Long" | "Short"
  entry_price: number
  exit_price: number | null
  entry_date: string
  exit_date: string | null
  quantity: number
  pnl: number | null
  status: "Win" | "Loss" | "Breakeven" | "Open"
  setup: string | null
}

export interface TradeFilters {
  startDate?: Date
  endDate?: Date
  symbol?: string
  direction?: "Long" | "Short"
  status?: "Win" | "Loss" | "Open" | "Breakeven"
  setup?: string
}

export function useTrades(filters: TradeFilters = {}) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState<TradeSortField>("entry_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const { user } = useAuth()
  const supabase = createClientComponentClient<Database>()

  const fetchTrades = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Format dates for query
      const from = filters.startDate?.toISOString()
      const to = filters.endDate?.toISOString()

      const { data, error, count } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .gte("entry_date", from || "")
        .lte("entry_date", to || "")
        .eq("direction", filters.direction || "")
        .eq("status", filters.status || "")
        .eq("setup", filters.setup || "")
        .ilike("symbol", `%${filters.symbol || ""}%`)
        .range(page, pageSize)
        .order(sortBy, { ascending: sortDirection === "asc" })
        .count()

      if (error) throw error

      setTrades(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [user, filters, page, pageSize, sortBy, sortDirection, supabase])

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  return {
    trades,
    isLoading,
    error,
    totalCount,
    page,
    pageSize,
    sortBy,
    sortDirection,
    setPage,
    setPageSize,
    setSortBy,
    setSortDirection,
  }
}
