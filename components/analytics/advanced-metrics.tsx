"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { BarChart, Bar } from "recharts"
import { LineChart, Line } from "recharts"
import { Separator } from "@/components/ui/separator"
import type { AnalyticsData } from "@/hooks/use-analytics-data"

interface AdvancedMetricsProps {
  data: AnalyticsData | null
  isLoading: boolean
}

export function AdvancedMetrics({ data, isLoading }: AdvancedMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Drawdown data
  const drawdownData = data?.drawdownData || []

  // Consecutive wins/losses data
  const streakData = data?.streakData || []

  // Risk-adjusted return metrics
  const riskMetrics = [
    { name: "Sharpe Ratio", value: data?.sharpeRatio || 0, description: "Return per unit of risk" },
    { name: "Sortino Ratio", value: data?.sortinoRatio || 0, description: "Return per unit of downside risk" },
    { name: "Calmar Ratio", value: data?.calmarRatio || 0, description: "Return relative to maximum drawdown" },
    { name: "Win/Loss Ratio", value: data?.winLossRatio || 0, description: "Average win / average loss" },
    { name: "Profit Factor", value: data?.profitFactor || 0, description: "Gross profit / gross loss" },
    {
      name: "Max Drawdown",
      value: data?.maxDrawdown || 0,
      description: "Largest peak-to-trough decline",
      isPercentage: true,
    },
  ]

  // Win rate by setup type
  const setupData = data?.winRateBySetup || []

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Drawdown Analysis</CardTitle>
            <CardDescription>Historical drawdown periods and recovery</CardDescription>
          </CardHeader>
          <CardContent>
            {!drawdownData.length ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={drawdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--muted))" }}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--muted))" }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, "Drawdown"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke="hsl(var(--loss))"
                      fill="hsl(var(--loss))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Consecutive Wins/Losses</CardTitle>
            <CardDescription>Trading streak analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {!streakData.length ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={streakData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis
                      dataKey="streakLength"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--muted))" }}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--muted))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "winStreaks") return [value, "Win Streaks"]
                        return [value, "Loss Streaks"]
                      }}
                    />
                    <Bar dataKey="winStreaks" name="Win Streaks" fill="hsl(var(--profit))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lossStreaks" name="Loss Streaks" fill="hsl(var(--loss))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle>Risk-Adjusted Return Metrics</CardTitle>
          <CardDescription>Advanced performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {riskMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-lg font-medium">{metric.name}</h3>
                <p className="text-2xl font-bold">
                  {metric.isPercentage ? `${metric.value.toFixed(2)}%` : metric.value.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
                <Separator className="mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle>Win Rate by Setup Type</CardTitle>
          <CardDescription>Performance breakdown by trading setup</CardDescription>
        </CardHeader>
        <CardContent>
          {!setupData.length ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No data available</p>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={setupData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                  <XAxis
                    dataKey="setup"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--muted))" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--muted))" }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: number) => [`${value}%`, "Win Rate"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
