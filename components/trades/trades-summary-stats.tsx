"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Trade } from "@/hooks/use-trades"

interface TradesSummaryStatsProps {
  trades: Trade[]
}

export function TradesSummaryStats({ trades }: TradesSummaryStatsProps) {
  // Calculate summary statistics
  const stats = useMemo(() => {
    // Filter out trades with no P&L (open trades)
    const closedTrades = trades.filter((trade) => trade.pnl !== null)

    if (closedTrades.length === 0) {
      return {
        winRate: 0,
        averagePnl: 0,
        totalPnl: 0,
        tradeCount: 0,
        bestTrade: null,
        worstTrade: null,
      }
    }

    // Calculate win rate
    const winningTrades = closedTrades.filter((trade) => trade.pnl && trade.pnl > 0)
    const winRate = (winningTrades.length / closedTrades.length) * 100

    // Calculate average P&L
    const totalPnl = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
    const averagePnl = totalPnl / closedTrades.length

    // Find best and worst trades
    const bestTrade = closedTrades.reduce(
      (best, trade) => (!best || (trade.pnl || 0) > (best.pnl || 0) ? trade : best),
      null as Trade | null,
    )

    const worstTrade = closedTrades.reduce(
      (worst, trade) => (!worst || (trade.pnl || 0) < (worst.pnl || 0) ? trade : worst),
      null as Trade | null,
    )

    return {
      winRate,
      averagePnl,
      totalPnl,
      tradeCount: closedTrades.length,
      bestTrade,
      worstTrade,
    }
  }, [trades])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="glass-card animate-slide-in" style={{ animationDelay: "0ms" }}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <h3 className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</h3>
            </div>
            <div className={cn("p-2 rounded-full", stats.winRate >= 50 ? "bg-green-500/20" : "bg-red-500/20")}>
              {stats.winRate >= 50 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Based on {stats.tradeCount} closed trades</div>
        </CardContent>
      </Card>

      <Card className="glass-card animate-slide-in" style={{ animationDelay: "50ms" }}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Average P&L</p>
              <h3
                className={cn(
                  "text-2xl font-bold",
                  stats.averagePnl > 0 ? "profit-text" : stats.averagePnl < 0 ? "loss-text" : "",
                )}
              >
                {stats.averagePnl > 0 ? "+" : ""}${stats.averagePnl.toFixed(2)}
              </h3>
            </div>
            <div className={cn("p-2 rounded-full", stats.averagePnl > 0 ? "bg-green-500/20" : "bg-red-500/20")}>
              {stats.averagePnl > 0 ? (
                <ArrowUp className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Per trade average</div>
        </CardContent>
      </Card>

      <Card className="glass-card animate-slide-in" style={{ animationDelay: "100ms" }}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total P&L</p>
              <h3
                className={cn(
                  "text-2xl font-bold",
                  stats.totalPnl > 0 ? "profit-text" : stats.totalPnl < 0 ? "loss-text" : "",
                )}
              >
                {stats.totalPnl > 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
              </h3>
            </div>
            <div className={cn("p-2 rounded-full", stats.totalPnl > 0 ? "bg-green-500/20" : "bg-red-500/20")}>
              {stats.totalPnl > 0 ? (
                <ArrowUp className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Across all filtered trades</div>
        </CardContent>
      </Card>

      <Card className="glass-card animate-slide-in" style={{ animationDelay: "150ms" }}>
        <CardContent className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">Best Trade</p>
            {stats.bestTrade ? (
              <>
                <h3 className="text-2xl font-bold profit-text">+${stats.bestTrade.pnl?.toFixed(2)}</h3>
                <div className="mt-2 text-xs">
                  <span className="font-medium">{stats.bestTrade.symbol}</span> • {stats.bestTrade.setup}
                </div>
              </>
            ) : (
              <h3 className="text-2xl font-bold">—</h3>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card animate-slide-in" style={{ animationDelay: "200ms" }}>
        <CardContent className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">Worst Trade</p>
            {stats.worstTrade ? (
              <>
                <h3 className="text-2xl font-bold loss-text">${stats.worstTrade.pnl?.toFixed(2)}</h3>
                <div className="mt-2 text-xs">
                  <span className="font-medium">{stats.worstTrade.symbol}</span> • {stats.worstTrade.setup}
                </div>
              </>
            ) : (
              <h3 className="text-2xl font-bold">—</h3>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
