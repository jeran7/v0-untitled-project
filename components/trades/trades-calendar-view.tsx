"use client"

import { useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Trade } from "@/hooks/use-trades"

interface TradesCalendarViewProps {
  trades: Trade[]
}

export function TradesCalendarView({ trades }: TradesCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // Get days in current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Group trades by date
  const tradesByDate = trades.reduce(
    (acc, trade) => {
      const date = new Date(trade.entry_date).toDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(trade)
      return acc
    },
    {} as Record<string, Trade[]>,
  )

  // Calculate day stats
  const getDayStats = (day: Date) => {
    const dayTrades = tradesByDate[day.toDateString()] || []
    const totalPnl = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
    const winCount = dayTrades.filter((trade) => trade.pnl && trade.pnl > 0).length
    const lossCount = dayTrades.filter((trade) => trade.pnl && trade.pnl < 0).length

    return {
      trades: dayTrades,
      count: dayTrades.length,
      totalPnl,
      winCount,
      lossCount,
      isProfit: totalPnl > 0,
    }
  }

  // Get day classes based on trades
  const getDayClass = (day: Date) => {
    const stats = getDayStats(day)

    if (!isSameMonth(day, currentMonth)) {
      return "opacity-30 bg-secondary/10"
    }

    if (stats.count === 0) {
      return "bg-secondary/10"
    }

    if (stats.isProfit) {
      return stats.totalPnl > 500 ? "bg-green-500/30" : "bg-green-500/20"
    } else {
      return stats.totalPnl < -500 ? "bg-red-500/30" : "bg-red-500/20"
    }
  }

  // Days of week
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{format(currentMonth, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date())}>
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Week days header */}
        {weekDays.map((day) => (
          <div key={day} className="text-center py-2 text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {Array(42)
          .fill(null)
          .map((_, i) => {
            const day = new Date(monthStart)
            day.setDate(day.getDate() - day.getDay() + i)
            const stats = getDayStats(day)

            return (
              <div
                key={i}
                className={cn(
                  "aspect-square p-2 border border-border/40 transition-colors hover:bg-secondary/20",
                  getDayClass(day),
                  isToday(day) && "ring-2 ring-primary/50",
                )}
              >
                <div className="flex flex-col h-full">
                  <div className="text-sm font-medium">{format(day, "d")}</div>

                  {stats.count > 0 && (
                    <div className="mt-auto">
                      <div className={cn("text-xs font-medium", stats.isProfit ? "profit-text" : "loss-text")}>
                        {stats.isProfit ? "+" : ""}
                        {stats.totalPnl.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {stats.winCount > 0 && (
                          <Badge variant="success" className="text-[0.65rem] px-1 py-0 h-4">
                            {stats.winCount}W
                          </Badge>
                        )}
                        {stats.lossCount > 0 && (
                          <Badge variant="destructive" className="text-[0.65rem] px-1 py-0 h-4">
                            {stats.lossCount}L
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
      </div>

      <div className="flex justify-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
          <span>Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
          <span>Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary/10"></div>
          <span>No Trades</span>
        </div>
      </div>
    </div>
  )
}
