"use client"

import { Tooltip } from "@/components/ui/tooltip"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useStrategies } from "@/hooks/use-strategies"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Bar, BarChart } from "recharts"

export default function PlaybookPerformancePage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : ""
  const { getStrategyById, loading } = useStrategies()
  const [strategy, setStrategy] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<any[]>([])

  useEffect(() => {
    const fetchStrategy = async () => {
      if (id) {
        const strategyData = await getStrategyById(id)
        setStrategy(strategyData)

        // Mock performance data - in a real app, this would come from your API
        const mockPerformanceData = [
          { month: "Jan", winRate: 65, profitFactor: 2.1, expectancy: 1.2, trades: 12 },
          { month: "Feb", winRate: 58, profitFactor: 1.8, expectancy: 0.9, trades: 15 },
          { month: "Mar", winRate: 72, profitFactor: 2.5, expectancy: 1.5, trades: 18 },
          { month: "Apr", winRate: 63, profitFactor: 2.0, expectancy: 1.1, trades: 16 },
          { month: "May", winRate: 70, profitFactor: 2.3, expectancy: 1.3, trades: 20 },
          { month: "Jun", winRate: 67, profitFactor: 2.2, expectancy: 1.2, trades: 15 },
        ]
        setPerformanceData(mockPerformanceData)
      }
    }

    fetchStrategy()
  }, [id, getStrategyById])

  if (loading) {
    return <PerformancePageSkeleton />
  }

  if (!strategy) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Strategy Not Found</CardTitle>
            <CardDescription>
              The strategy you're looking for doesn't exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{strategy.name} Performance</h1>
        <p className="text-muted-foreground">Detailed performance metrics and analysis for this trading strategy</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Win Rate" value={`${strategy.winRate || 0}%`} trend={+2.5} />
            <MetricCard title="Profit Factor" value={strategy.profitFactor || 0} trend={+0.3} />
            <MetricCard title="Expectancy" value={`$${strategy.expectancy || 0}`} trend={+0.1} />
            <MetricCard title="Total Trades" value={strategy.totalTrades || 0} trend={0} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>Monthly win rate and profit factor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="winRate"
                      stroke="hsl(var(--primary))"
                      name="Win Rate (%)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="profitFactor"
                      stroke="hsl(var(--secondary))"
                      name="Profit Factor"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trade Metrics</CardTitle>
              <CardDescription>Detailed performance metrics for this strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="expectancy" fill="hsl(var(--primary))" name="Expectancy" />
                    <Bar dataKey="trades" fill="hsl(var(--secondary))" name="Number of Trades" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Average Trade</CardTitle>
                <CardDescription>Metrics for the average trade</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">Duration:</dt>
                    <dd>2.3 days</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Profit/Loss:</dt>
                    <dd className="text-green-600">$245.32</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">R Multiple:</dt>
                    <dd>1.8R</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Risk/Reward:</dt>
                    <dd>1:2.5</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Conditions</CardTitle>
                <CardDescription>Performance in different market conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">Bull Market:</dt>
                    <dd className="text-green-600">72% Win Rate</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Bear Market:</dt>
                    <dd className="text-yellow-600">58% Win Rate</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Sideways:</dt>
                    <dd className="text-blue-600">63% Win Rate</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Volatile:</dt>
                    <dd className="text-red-600">51% Win Rate</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trades" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
              <CardDescription>Last 5 trades using this strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Symbol</th>
                      <th className="px-4 py-2 text-left">Direction</th>
                      <th className="px-4 py-2 text-right">P/L</th>
                      <th className="px-4 py-2 text-right">R Multiple</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-2">2023-04-15</td>
                      <td className="px-4 py-2">AAPL</td>
                      <td className="px-4 py-2">Long</td>
                      <td className="px-4 py-2 text-right text-green-600">+$320.45</td>
                      <td className="px-4 py-2 text-right">2.1R</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">2023-04-12</td>
                      <td className="px-4 py-2">MSFT</td>
                      <td className="px-4 py-2">Long</td>
                      <td className="px-4 py-2 text-right text-green-600">+$156.78</td>
                      <td className="px-4 py-2 text-right">1.3R</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">2023-04-10</td>
                      <td className="px-4 py-2">TSLA</td>
                      <td className="px-4 py-2">Short</td>
                      <td className="px-4 py-2 text-right text-red-600">-$98.32</td>
                      <td className="px-4 py-2 text-right">-0.8R</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">2023-04-05</td>
                      <td className="px-4 py-2">AMZN</td>
                      <td className="px-4 py-2">Long</td>
                      <td className="px-4 py-2 text-right text-green-600">+$412.67</td>
                      <td className="px-4 py-2 text-right">2.8R</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">2023-04-01</td>
                      <td className="px-4 py-2">NVDA</td>
                      <td className="px-4 py-2">Long</td>
                      <td className="px-4 py-2 text-right text-green-600">+$276.21</td>
                      <td className="px-4 py-2 text-right">1.9R</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({ title, value, trend }: { title: string; value: string | number; trend: number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {trend !== 0 && (
            <span className={`text-xs ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          )}
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function PerformancePageSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>

      <Skeleton className="h-10 w-[400px]" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-1/2 mb-2" />
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
