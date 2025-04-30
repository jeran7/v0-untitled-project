"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TradingViewChart } from "@/components/charts/trading-view-chart"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts"
import type { AnalyticsData } from "@/hooks/use-analytics-data"

interface SymbolPerformanceProps {
  data: AnalyticsData | null
  isLoading: boolean
}

export function SymbolPerformance({ data, isLoading }: SymbolPerformanceProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Top performing symbols data
  const topSymbols = data?.pnlBySymbol?.sort((a, b) => b.pnl - a.pnl).slice(0, 5) || []

  // Most traded symbols data
  const mostTraded = data?.tradeCountBySymbol?.sort((a, b) => b.count - a.count).slice(0, 10) || []

  // Sector performance data
  const sectorData = data?.pnlBySector || []

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Top Performing Symbols</CardTitle>
            <CardDescription>Symbols with the highest P&L</CardDescription>
          </CardHeader>
          <CardContent>
            {!topSymbols.length ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSymbols} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis
                      dataKey="symbol"
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
                      {topSymbols.map((entry, index) => (
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
            <CardTitle>Most Traded Symbols</CardTitle>
            <CardDescription>Symbols with the highest trade count</CardDescription>
          </CardHeader>
          <CardContent>
            {!mostTraded.length ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mostTraded.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 text-center text-muted-foreground">{index + 1}</div>
                      <div className="font-medium">{item.symbol}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-muted-foreground">{item.count} trades</div>
                      <Badge variant={item.winRate >= 50 ? "success" : "destructive"} className="ml-2">
                        {item.winRate}% Win
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle>Sector Performance</CardTitle>
          <CardDescription>P&L breakdown by market sector</CardDescription>
        </CardHeader>
        <CardContent>
          {!sectorData.length ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No data available</p>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                  <XAxis
                    dataKey="sector"
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
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {topSymbols.slice(0, 2).map((symbol, index) => (
          <Card key={index} className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle>{symbol.symbol} Chart</CardTitle>
              <CardDescription>Recent price action and your trades</CardDescription>
            </CardHeader>
            <CardContent>
              <TradingViewChart
                data={data?.symbolCharts?.[symbol.symbol] || []}
                title=""
                height={300}
                showFullScreenButton={true}
                showDownloadButton={false}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
