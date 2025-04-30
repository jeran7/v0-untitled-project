"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { DateRangeSelector } from "@/components/analytics/date-range-selector"
import { SummaryCards } from "@/components/analytics/summary-cards"
import { EquityCurveChart } from "@/components/analytics/equity-curve-chart"
import { PerformanceBreakdown } from "@/components/analytics/performance-breakdown"
import { SymbolPerformance } from "@/components/analytics/symbol-performance"
import { PsychologicalAnalysis } from "@/components/analytics/psychological-analysis"
import { AdvancedMetrics } from "@/components/analytics/advanced-metrics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAnalyticsData } from "@/hooks/use-analytics-data"

export default function AnalyticsDashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    to: new Date(),
  })

  const { data, isLoading, error } = useAnalyticsData(dateRange.from, dateRange.to)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [authLoading, user, router])

  // Show error toast if data fetching fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading analytics data",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="container py-10 animate-in">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-4">
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
            <h1 className="text-3xl font-bold tracking-tight">Trading Analytics</h1>
            <p className="text-muted-foreground">Comprehensive analysis of your trading performance</p>
          </div>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </div>

        <SummaryCards data={data} isLoading={isLoading} />

        <EquityCurveChart data={data?.equityCurve} isLoading={isLoading} />

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="bg-secondary/30 w-full justify-start">
            <TabsTrigger value="performance">Performance Breakdown</TabsTrigger>
            <TabsTrigger value="symbols">Symbol Analysis</TabsTrigger>
            <TabsTrigger value="psychology">Psychological Factors</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceBreakdown data={data} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="symbols" className="space-y-6">
            <SymbolPerformance data={data} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="psychology" className="space-y-6">
            <PsychologicalAnalysis data={data} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <AdvancedMetrics data={data} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
