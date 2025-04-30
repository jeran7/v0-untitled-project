"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { BarChart, Bar } from "recharts"
import { LineChart, Line } from "recharts"
import { Progress } from "@/components/ui/progress"
import type { AnalyticsData } from "@/hooks/use-analytics-data"

interface PsychologicalAnalysisProps {
  data: AnalyticsData | null
  isLoading: boolean
}

export function PsychologicalAnalysis({ data, isLoading }: PsychologicalAnalysisProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Confidence vs. Results data
  const confidenceData =
    data?.psychologyData?.map((item) => ({
      confidence: item.confidenceLevel || 0,
      pnl: item.pnl || 0,
      symbol: item.symbol,
    })) || []

  // Focus Level Impact data
  const focusData = data?.focusLevelImpact || []

  // Sleep Quality data
  const sleepData = data?.sleepQualityImpact || []

  // Emotional state correlation
  const emotionalData = [
    { name: "Stress", value: data?.stressLevelAvg || 0, maxValue: 10 },
    { name: "FOMO", value: data?.fomoLevelAvg || 0, maxValue: 10 },
    { name: "Patience", value: data?.patienceLevelAvg || 0, maxValue: 10 },
    { name: "Discipline", value: data?.disciplineLevelAvg || 0, maxValue: 10 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Confidence vs. Results</CardTitle>
            <CardDescription>Correlation between confidence level and P&L</CardDescription>
          </CardHeader>
          <CardContent>
            {!confidenceData.length ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis
                      type="number"
                      dataKey="confidence"
                      name="Confidence"
                      domain={[0, 10]}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--muted))" }}
                      label={{
                        value: "Confidence Level",
                        position: "insideBottom",
                        offset: -10,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="pnl"
                      name="P&L"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--muted))" }}
                      label={{
                        value: "P&L ($)",
                        angle: -90,
                        position: "insideLeft",
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "Confidence") return [value, "Confidence Level"]
                        return [`$${value.toLocaleString()}`, "P&L"]
                      }}
                      labelFormatter={(value) => ""}
                    />
                    <Scatter name="Trades" data={confidenceData} fill="hsl(var(--primary))">
                      {confidenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Focus Level Impact</CardTitle>
            <CardDescription>How focus level affects win rate</CardDescription>
          </CardHeader>
          <CardContent>
            {!focusData.length ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={focusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis
                      dataKey="focusLevel"
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Sleep Quality Correlation</CardTitle>
            <CardDescription>Impact of sleep quality on trading performance</CardDescription>
          </CardHeader>
          <CardContent>
            {!sleepData.length ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis
                      dataKey="sleepQuality"
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
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Avg P&L"]}
                    />
                    <Bar dataKey="avgPnl" name="Avg P&L" radius={[4, 4, 0, 0]}>
                      {sleepData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.avgPnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"}
                        />
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
            <CardTitle>Emotional State Analysis</CardTitle>
            <CardDescription>Average levels of emotional factors</CardDescription>
          </CardHeader>
          <CardContent>
            {!emotionalData.length ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="space-y-6 pt-4">
                {emotionalData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.value.toFixed(1)} / {item.maxValue}
                      </span>
                    </div>
                    <Progress value={(item.value / item.maxValue) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
