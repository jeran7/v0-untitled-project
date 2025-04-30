"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3, BookOpen, LineChart, Plus, TrendingUp } from "lucide-react"
import { EquityCurveChart } from "@/components/equity-curve-chart"
import { WinRateChart } from "@/components/win-rate-chart"
import { RecentTradesTable } from "@/components/recent-trades-table"
import { PerformanceMetrics } from "@/components/performance-metrics"
import { TradeAnalysis } from "@/components/trade-analysis"
import { UsageCard } from "@/components/usage-card"

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, isLoading, auth } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [isLoading, user, router])

  // Loading state
  if (isLoading || !user) {
    return (
      <div className="container py-10 animate-in">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
          </div>

          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10 animate-in">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {profile?.display_name || user.email?.split("@")[0]}
            </h1>
            <p className="text-muted-foreground">Here's an overview of your trading performance</p>
          </div>
          <Button onClick={() => router.push("/trades/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Trade
          </Button>
        </div>

        {/* Usage metrics section */}
        {user && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <UsageCard
              title="Trades Used"
              current={auth?.usage?.length ? auth.getRemainingUsage("trades") : 0}
              max={auth?.subscriptionPlan?.trade_limit || 0}
              percentage={auth?.usage?.length ? auth.getUsagePercentage("trades") : 0}
            />
            <UsageCard
              title="AI Queries"
              current={auth?.usage?.length ? auth.getRemainingUsage("ai_queries") : 0}
              max={auth?.subscriptionPlan?.ai_query_limit || 0}
              percentage={auth?.usage?.length ? auth.getUsagePercentage("ai_queries") : 0}
            />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Total P&L</CardDescription>
              <CardTitle className="text-2xl profit-text">+$12,543.87</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +15.3% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Win Rate</CardDescription>
              <CardTitle className="text-2xl">68%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +2.5% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Avg. R Multiple</CardDescription>
              <CardTitle className="text-2xl">2.3R</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +0.4R from last month
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Total Trades</CardDescription>
              <CardTitle className="text-2xl">124</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +18 from last month
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-secondary/30">
            <TabsTrigger value="overview" className="gap-2">
              <LineChart className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="journal" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Journal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Equity Curve</CardTitle>
                </CardHeader>
                <CardContent>
                  <EquityCurveChart />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <WinRateChart />
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentTradesTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceMetrics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journal" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Trade Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <TradeAnalysis />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
