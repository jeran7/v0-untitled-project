"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalyticsData } from "@/hooks/use-analytics-data"

interface SummaryCardsProps {
  data: AnalyticsData | null
  isLoading: boolean
}

export function SummaryCards({ data, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
      </div>
    )
  }

  const metrics = [
    {
      title: "Win Rate",
      value: data?.winRate ? `${data.winRate.toFixed(1)}%` : "N/A",
      description: "Overall win percentage",
      change: data?.winRateChange || 0,
      changeLabel: "vs previous period",
    },
    {
      title: "Profit Factor",
      value: data?.profitFactor ? data.profitFactor.toFixed(2) : "N/A",
      description: "Gross profit / gross loss",
      change: data?.profitFactorChange || 0,
      changeLabel: "vs previous period",
    },
    {
      title: "Total P&L",
      value: data?.totalPnL ? `$${data.totalPnL.toLocaleString()}` : "N/A",
      description: "Net profit/loss",
      change: data?.pnlChange || 0,
      changeLabel: "vs previous period",
      isCurrency: true,
    },
    {
      title: "Avg. R-Multiple",
      value: data?.avgRMultiple ? `${data.avgRMultiple.toFixed(2)}R` : "N/A",
      description: "Average return per trade",
      change: data?.rMultipleChange || 0,
      changeLabel: "vs previous period",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="glass-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardDescription>{metric.title}</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl",
                metric.title === "Total P&L" && data?.totalPnL && data.totalPnL > 0 ? "profit-text" : "",
                metric.title === "Total P&L" && data?.totalPnL && data.totalPnL < 0 ? "loss-text" : "",
              )}
            >
              {metric.value}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              {metric.change > 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">
                    {metric.isCurrency ? "$" : ""}
                    {Math.abs(metric.change).toFixed(1)}
                    {metric.isCurrency ? "" : "%"}
                  </span>
                </>
              ) : metric.change < 0 ? (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  <span className="text-red-500">
                    {metric.isCurrency ? "$" : ""}
                    {Math.abs(metric.change).toFixed(1)}
                    {metric.isCurrency ? "" : "%"}
                  </span>
                </>
              ) : (
                <span>No change</span>
              )}
              <span className="ml-1">{metric.changeLabel}</span>
            </div>
          </CardContent>

          {/* Decorative gradient bar at bottom */}
          <div
            className={cn(
              "h-1 w-full",
              metric.change > 0
                ? "bg-gradient-to-r from-green-500/30 to-green-500/60"
                : metric.change < 0
                  ? "bg-gradient-to-r from-red-500/30 to-red-500/60"
                  : "bg-gradient-to-r from-gray-500/30 to-gray-500/60",
            )}
          />
        </Card>
      ))}
    </div>
  )
}
