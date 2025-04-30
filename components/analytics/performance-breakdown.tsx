"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TradingViewChart } from "@/components/charts/trading-view-chart"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import type { AnalyticsData } from "@/hooks/use-analytics-data"

interface PerformanceBreakdownProps {
  data: AnalyticsData | null
  isLoading: boolean
}

export function PerformanceBreakdown({ data, isLoading }: PerformanceBreakdownProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Win/Loss data for pie chart
  const winLossData = [
    { name: "Wins", value: data?.winCount || 0, color: "hsl(var(--profit))" },
    { name: "Losses", value: data?.lossCount || 0, color: "hsl(var(--loss))" },
  ]

  // P&L by strategy data for bar chart
  const strategyData = data?.pnlByStrategy || []

  // P&L by day of week data for bar chart
  const dayOfWeekData = data?.pnlByDayOfWeek || []

  // Trade duration vs P&L data for scatter plot
  const durationVsPnlData =
    data?.tradeDetails?.map((trade) => ({
      duration: trade.durationHours || 0,
      pnl: trade.pnl || 0,
      symbol: trade.symbol,
    })) || []

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Win/Loss Ratio</CardTitle>
            <CardDescription>Distribution of winning and losing trades</CardDescription>
          </CardHeader>
          <CardContent>
            {!winLossData.length || (winLossData[0].value === 0 && winLossData[1].value === 0) ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number) => [value, "Trades"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>P&L by Strategy</CardTitle>
            <CardDescription>Performance breakdown by trading strategy</CardDescription>
          </CardHeader>
          <CardContent>
            {!strategyData.length ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strategyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis
                      dataKey="strategy"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--muted))" }}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--muted))" }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "P&L"]}
                    />
                    <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>P&L by Day of Week</CardTitle>
            <CardDescription>Performance breakdown by trading day</CardDescription>
          </CardHeader>
          <CardContent>
            {!dayOfWeekData.length ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--muted))" }}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--muted))" }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "P&L"]}
                    />
                    <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                      {dayOfWeekData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Trade Duration vs. P&L</CardTitle>
            <CardDescription>Correlation between trade duration and performance</CardDescription>
          </CardHeader>
          <CardContent>
            {!durationVsPnlData.length ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <TradingViewChart
                data={durationVsPnlData.map((item) => ({
                  time: item.duration,
                  value: item.pnl,
                }))}
                title=""
                height={300}
                showFullScreenButton={false}
                showDownloadButton={false}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
