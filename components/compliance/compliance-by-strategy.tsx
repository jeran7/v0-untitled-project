"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ComplianceByStrategyProps {
  data:
    | {
        id: string
        name: string
        category: string
        trades: number
        averageCompliance: number
        profitableTrades: number
        unprofitableTrades: number
        profitableCompliance: number
        unprofitableCompliance: number
      }[]
    | null
  isLoading: boolean
}

export function ComplianceByStrategy({ data, isLoading }: ComplianceByStrategyProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No strategy compliance data available</p>
        </CardContent>
      </Card>
    )
  }

  // Format category name
  const formatCategoryName = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      breakout: "bg-blue-500/20 text-blue-500",
      reversal: "bg-red-500/20 text-red-500",
      trend_following: "bg-green-500/20 text-green-500",
      pullback: "bg-amber-500/20 text-amber-500",
      support_resistance: "bg-purple-500/20 text-purple-500",
      momentum: "bg-cyan-500/20 text-cyan-500",
      volatility: "bg-orange-500/20 text-orange-500",
      gap: "bg-indigo-500/20 text-indigo-500",
      pattern: "bg-rose-500/20 text-rose-500",
    }
    return colors[category] || "bg-gray-500/20 text-gray-500"
  }

  // Prepare chart data
  const chartData = data.map((strategy) => ({
    name: strategy.name,
    compliance: Math.round(strategy.averageCompliance),
    profitableCompliance: Math.round(strategy.profitableCompliance),
    unprofitableCompliance: Math.round(strategy.unprofitableCompliance),
    trades: strategy.trades,
  }))

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Strategy Compliance Comparison</CardTitle>
          <CardDescription>Average compliance rate by strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overall">
            <TabsList className="mb-4">
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="profitable">Profitable vs. Unprofitable</TabsTrigger>
            </TabsList>
            <TabsContent value="overall">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Compliance"]}
                      labelFormatter={(label) => `Strategy: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="compliance" name="Compliance Rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="profitable">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Compliance"]}
                      labelFormatter={(label) => `Strategy: ${label}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="profitableCompliance"
                      name="Profitable Trades"
                      fill="hsl(var(--profit))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="unprofitableCompliance"
                      name="Unprofitable Trades"
                      fill="hsl(var(--loss))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {data.map((strategy) => (
          <Card key={strategy.id} className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{strategy.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Badge className={getCategoryColor(strategy.category)}>
                      {formatCategoryName(strategy.category)}
                    </Badge>
                    <span className="ml-2">{strategy.trades} trades</span>
                  </CardDescription>
                </div>
                <div className="text-2xl font-bold">{Math.round(strategy.averageCompliance)}%</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall Compliance</span>
                    <span>{Math.round(strategy.averageCompliance)}%</span>
                  </div>
                  <Progress value={strategy.averageCompliance} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Profitable Trades</span>
                      <span>{Math.round(strategy.profitableCompliance)}%</span>
                    </div>
                    <Progress value={strategy.profitableCompliance} className="h-2 bg-muted/50" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Unprofitable Trades</span>
                      <span>{Math.round(strategy.unprofitableCompliance)}%</span>
                    </div>
                    <Progress value={strategy.unprofitableCompliance} className="h-2 bg-muted/50" />
                  </div>
                </div>

                <div className="pt-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total Trades:</span>
                    <span className="font-medium">{strategy.trades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profitable:</span>
                    <span className="font-medium">
                      {strategy.profitableTrades} ({Math.round((strategy.profitableTrades / strategy.trades) * 100)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unprofitable:</span>
                    <span className="font-medium">
                      {strategy.unprofitableTrades} ({Math.round((strategy.unprofitableTrades / strategy.trades) * 100)}
                      %)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
