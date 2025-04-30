"use client"

import { useState } from "react"
import { useComplianceData } from "@/hooks/use-compliance-data"
import { DateRangePicker } from "@/components/date-range-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PerformanceComparisonChart } from "@/components/compliance/performance-comparison-chart"
import { RuleImpactAnalysis } from "@/components/compliance/rule-impact-analysis"
import { StrategyOptimizationSuggestions } from "@/components/compliance/strategy-optimization-suggestions"
import { DetailedAnalysisTable } from "@/components/compliance/detailed-analysis-table"
import { Skeleton } from "@/components/ui/skeleton"

export function PerformanceByComplianceAnalysis() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined)
  const { data, loading, error } = useComplianceData(dateRange)

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="text-center text-red-500">Error loading compliance data</p>
            <p className="text-center text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Performance Analysis</h2>
        <DateRangePicker onChange={setDateRange} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="glass-card grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rule-impact">Rule Impact</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Performance by Compliance Level</CardTitle>
              <CardDescription>
                Compare trading performance across different levels of strategy compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <PerformanceComparisonChart data={data?.performanceByCompliance || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rule-impact" className="mt-4">
          <RuleImpactAnalysis data={data} loading={loading} />
        </TabsContent>

        <TabsContent value="optimization" className="mt-4">
          <StrategyOptimizationSuggestions data={data} loading={loading} />
        </TabsContent>

        <TabsContent value="trades" className="mt-4">
          <DetailedAnalysisTable data={data} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
