"use client"

import { useMemo } from "react"
import { parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import type { Trade } from "@/hooks/use-trades"

interface TradesHeatmapViewProps {
  trades: Trade[]
}

export function TradesHeatmapView({ trades }: TradesHeatmapViewProps) {
  // Process trades data for heatmap
  const heatmapData = useMemo(() => {
    // Days of week (0 = Sunday, 6 = Saturday)
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    // Hours of day (0-23)
    const hoursOfDay = Array.from({ length: 24 }, (_, i) => i)

    // Initialize heatmap data
    const data: Record<string, Record<string, { count: number; pnl: number; avgPnl: number }>> = {}

    // Initialize all day/hour combinations
    daysOfWeek.forEach((day) => {
      data[day] = {}
      hoursOfDay.forEach((hour) => {
        data[day][hour] = { count: 0, pnl: 0, avgPnl: 0 }
      })
    })

    // Process trades
    trades.forEach((trade) => {
      if (!trade.entry_date || !trade.pnl) return

      const date = parseISO(trade.entry_date.toString())
      const day = daysOfWeek[date.getDay()]
      const hour = date.getHours()

      data[day][hour].count += 1
      data[day][hour].pnl += trade.pnl
      data[day][hour].avgPnl = data[day][hour].pnl / data[day][hour].count
    })

    return { data, daysOfWeek, hoursOfDay }
  }, [trades])

  // Get cell color based on data
  const getCellColor = (day: string, hour: number) => {
    const cell = heatmapData.data[day][hour]

    if (cell.count === 0) {
      return "bg-secondary/10"
    }

    if (cell.avgPnl > 0) {
      return cell.avgPnl > 100 ? "bg-green-500/40" : cell.avgPnl > 50 ? "bg-green-500/30" : "bg-green-500/20"
    } else {
      return cell.avgPnl < -100 ? "bg-red-500/40" : cell.avgPnl < -50 ? "bg-red-500/30" : "bg-red-500/20"
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Trade Performance by Time</h3>
        <p className="text-sm text-muted-foreground">
          This heatmap shows your trading performance by day of week and hour of day. Darker green indicates better
          performance, darker red indicates worse performance.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Hours header */}
          <div className="grid grid-cols-[100px_repeat(24,minmax(30px,1fr))]">
            <div className="text-center py-2"></div>
            {heatmapData.hoursOfDay.map((hour) => (
              <div key={hour} className="text-center py-2 text-xs font-medium text-muted-foreground">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Heatmap rows */}
          {heatmapData.daysOfWeek.map((day) => (
            <div key={day} className="grid grid-cols-[100px_repeat(24,minmax(30px,1fr))]">
              <div className="py-2 text-sm font-medium">{day}</div>
              {heatmapData.hoursOfDay.map((hour) => {
                const cell = heatmapData.data[day][hour]
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={cn(
                      "aspect-square border border-border/20 transition-colors hover:opacity-80",
                      getCellColor(day, hour),
                    )}
                  >
                    {cell.count > 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-xs">
                        <div className={cn("font-medium", cell.avgPnl > 0 ? "profit-text" : "loss-text")}>
                          {cell.count > 1 ? `${cell.avgPnl.toFixed(0)}` : `${cell.pnl.toFixed(0)}`}
                        </div>
                        <div className="text-[0.65rem] text-muted-foreground">{cell.count}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/40"></div>
          <span>High Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
          <span>Low Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
          <span>Low Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/40"></div>
          <span>High Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary/10"></div>
          <span>No Trades</span>
        </div>
      </div>
    </div>
  )
}
