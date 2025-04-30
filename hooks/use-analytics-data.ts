"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth/auth-provider"
import type { LineData } from "lightweight-charts"
import type { Database } from "@/types/database"

export interface AnalyticsData {
  // Summary metrics
  winRate: number
  winRateChange: number
  profitFactor: number
  profitFactorChange: number
  totalPnL: number
  pnlChange: number
  avgRMultiple: number
  rMultipleChange: number

  // Equity curve data
  equityCurve: LineData[]

  // Performance breakdown
  winCount: number
  lossCount: number
  pnlByStrategy: { strategy: string; pnl: number }[]
  pnlByDayOfWeek: { day: string; pnl: number }[]
  tradeDetails: {
    id: string
    symbol: string
    pnl: number
    durationHours: number
  }[]

  // Symbol performance
  pnlBySymbol: { symbol: string; pnl: number }[]
  tradeCountBySymbol: { symbol: string; count: number; winRate: number }[]
  pnlBySector: { sector: string; pnl: number }[]
  symbolCharts: Record<string, LineData[]>

  // Psychological data
  psychologyData: {
    confidenceLevel: number
    focusLevel: number
    pnl: number
    symbol: string
  }[]
  focusLevelImpact: { focusLevel: number; winRate: number }[]
  sleepQualityImpact: { sleepQuality: string; avgPnl: number }[]
  stressLevelAvg: number
  fomoLevelAvg: number
  patienceLevelAvg: number
  disciplineLevelAvg: number

  // Advanced metrics
  drawdownData: { date: string; drawdown: number }[]
  streakData: { streakLength: number; winStreaks: number; lossStreaks: number }[]
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  winLossRatio: number
  maxDrawdown: number
  winRateBySetup: { setup: string; winRate: number }[]
}

export function useAnalyticsData(fromDate: Date, toDate: Date) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        // Format dates for query
        const from = fromDate.toISOString()
        const to = toDate.toISOString()

        // Fetch trades data
        const { data: trades, error: tradesError } = await supabase
          .from("trades")
          .select(`
            id,
            symbol,
            direction,
            entry_price,
            exit_price,
            entry_date,
            exit_date,
            quantity,
            profit_loss,
            status,
            trade_details (
              id,
              stop_loss,
              take_profit,
              strategy_id,
              risk_reward_planned,
              risk_reward_actual,
              notes
            ),
            trade_psychology (
              id,
              confidence_level,
              focus_level,
              stress_level,
              fomo_level,
              patience_level,
              discipline_level,
              sleep_quality
            )
          `)
          .eq("user_id", user.id)
          .gte("entry_date", from)
          .lte("entry_date", to)
          .order("entry_date", { ascending: true })

        if (tradesError) throw tradesError

        // If no trades data, use mock data
        if (!trades || trades.length === 0) {
          setData(generateMockData())
          setIsLoading(false)
          return
        }

        // Process trades data
        const processedData = processTradesData(trades, fromDate, toDate)
        setData(processedData)
      } catch (err) {
        console.error("Error fetching analytics data:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch analytics data"))
        // Fall back to mock data
        setData(generateMockData())
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, fromDate, toDate, supabase])

  return { data, isLoading, error }
}

// Process trades data into analytics format
function processTradesData(trades: any[], fromDate: Date, toDate: Date): AnalyticsData {
  // This would be a complex function to process the real data
  // For now, we'll return mock data
  return generateMockData()
}

// Generate mock data for development and fallback
function generateMockData(): AnalyticsData {
  // Generate dates for the past 90 days
  const dates: string[] = []
  const now = new Date()
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split("T")[0])
  }

  // Generate equity curve data
  let balance = 10000
  const equityCurve: LineData[] = []

  dates.forEach((date) => {
    // Random daily change between -2% and +3%
    const dailyChange = balance * (Math.random() * 0.05 - 0.02)
    balance += dailyChange

    equityCurve.push({
      time: date,
      value: balance,
    })
  })

  // Generate drawdown data
  const drawdownData = dates.map((date) => {
    return {
      date,
      drawdown: Math.random() * 10,
    }
  })

  // Generate streak data
  const streakData = [
    { streakLength: 1, winStreaks: 15, lossStreaks: 10 },
    { streakLength: 2, winStreaks: 8, lossStreaks: 5 },
    { streakLength: 3, winStreaks: 4, lossStreaks: 2 },
    { streakLength: 4, winStreaks: 2, lossStreaks: 1 },
    { streakLength: 5, winStreaks: 1, lossStreaks: 0 },
  ]

  // Generate win rate by setup
  const winRateBySetup = [
    { setup: "Breakout", winRate: 78 },
    { setup: "Pullback", winRate: 65 },
    { setup: "Reversal", winRate: 52 },
    { setup: "Trend", winRate: 72 },
    { setup: "Range", winRate: 58 },
  ]

  // Generate symbol charts
  const symbolCharts: Record<string, LineData[]> = {
    AAPL: generateMockPriceData(dates),
    MSFT: generateMockPriceData(dates),
    GOOGL: generateMockPriceData(dates),
    AMZN: generateMockPriceData(dates),
    TSLA: generateMockPriceData(dates),
  }

  return {
    // Summary metrics
    winRate: 68.5,
    winRateChange: 2.5,
    profitFactor: 2.3,
    profitFactorChange: 0.2,
    totalPnL: 2543.87,
    pnlChange: 15.3,
    avgRMultiple: 1.8,
    rMultipleChange: 0.3,

    // Equity curve data
    equityCurve,

    // Performance breakdown
    winCount: 85,
    lossCount: 39,
    pnlByStrategy: [
      { strategy: "Breakout", pnl: 1250 },
      { strategy: "Pullback", pnl: 850 },
      { strategy: "Reversal", pnl: -320 },
      { strategy: "Trend", pnl: 1450 },
      { strategy: "Range", pnl: -150 },
    ],
    pnlByDayOfWeek: [
      { day: "Monday", pnl: 450 },
      { day: "Tuesday", pnl: 850 },
      { day: "Wednesday", pnl: -250 },
      { day: "Thursday", pnl: 1200 },
      { day: "Friday", pnl: 350 },
    ],
    tradeDetails: Array(20)
      .fill(0)
      .map((_, i) => ({
        id: `trade-${i}`,
        symbol: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"][Math.floor(Math.random() * 5)],
        pnl: Math.random() * 1000 - 300,
        durationHours: Math.random() * 48,
      })),

    // Symbol performance
    pnlBySymbol: [
      { symbol: "AAPL", pnl: 950 },
      { symbol: "MSFT", pnl: 750 },
      { symbol: "GOOGL", pnl: -150 },
      { symbol: "AMZN", pnl: 650 },
      { symbol: "TSLA", pnl: 350 },
    ],
    tradeCountBySymbol: [
      { symbol: "AAPL", count: 25, winRate: 72 },
      { symbol: "MSFT", count: 18, winRate: 67 },
      { symbol: "GOOGL", count: 15, winRate: 53 },
      { symbol: "AMZN", count: 12, winRate: 75 },
      { symbol: "TSLA", count: 10, winRate: 60 },
      { symbol: "META", count: 8, winRate: 63 },
      { symbol: "NVDA", count: 7, winRate: 71 },
      { symbol: "AMD", count: 6, winRate: 50 },
      { symbol: "INTC", count: 5, winRate: 40 },
      { symbol: "NFLX", count: 4, winRate: 75 },
    ],
    pnlBySector: [
      { sector: "Technology", pnl: 1850 },
      { sector: "Consumer Cyclical", pnl: 750 },
      { sector: "Communication Services", pnl: -250 },
      { sector: "Healthcare", pnl: 450 },
      { sector: "Financials", pnl: -150 },
    ],
    symbolCharts,

    // Psychological data
    psychologyData: Array(30)
      .fill(0)
      .map(() => ({
        confidenceLevel: Math.random() * 10,
        focusLevel: Math.random() * 10,
        pnl: Math.random() * 1000 - 300,
        symbol: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"][Math.floor(Math.random() * 5)],
      })),
    focusLevelImpact: [
      { focusLevel: 1, winRate: 30 },
      { focusLevel: 2, winRate: 35 },
      { focusLevel: 3, winRate: 40 },
      { focusLevel: 4, winRate: 45 },
      { focusLevel: 5, winRate: 50 },
      { focusLevel: 6, winRate: 55 },
      { focusLevel: 7, winRate: 65 },
      { focusLevel: 8, winRate: 75 },
      { focusLevel: 9, winRate: 80 },
      { focusLevel: 10, winRate: 85 },
    ],
    sleepQualityImpact: [
      { sleepQuality: "Poor", avgPnl: -50 },
      { sleepQuality: "Fair", avgPnl: 25 },
      { sleepQuality: "Good", avgPnl: 75 },
      { sleepQuality: "Excellent", avgPnl: 150 },
    ],
    stressLevelAvg: 5.2,
    fomoLevelAvg: 4.8,
    patienceLevelAvg: 6.5,
    disciplineLevelAvg: 7.2,

    // Advanced metrics
    drawdownData,
    streakData,
    sharpeRatio: 1.8,
    sortinoRatio: 2.2,
    calmarRatio: 1.5,
    winLossRatio: 1.7,
    maxDrawdown: 12.5,
    winRateBySetup,
  }
}

// Generate mock price data for symbol charts
function generateMockPriceData(dates: string[]): LineData[] {
  let price = 100 + Math.random() * 200

  return dates.map((date) => {
    // Random daily change between -3% and +3%
    const dailyChange = price * (Math.random() * 0.06 - 0.03)
    price += dailyChange

    return {
      time: date,
      value: price,
    }
  })
}
