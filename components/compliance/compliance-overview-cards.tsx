"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from "lucide-react"
import { ComplianceTrendChart } from "@/components/compliance/compliance-trend-chart"
import { Badge } from "@/components/ui/badge"
import type { ComplianceData } from "@/hooks/use-compliance-data"

interface ComplianceOverviewCardsProps {
  data: ComplianceData | null
  isLoading: boolean
}

export function ComplianceOverviewCards({ data, isLoading }: ComplianceOverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No compliance data available</p>
        </CardContent>
      </Card>
    )
  }

  // Find most followed strategy
  const mostFollowedStrategy =
    data.complianceByStrategy.length > 0
      ? data.complianceByStrategy.reduce((prev, current) => (prev.compliance > current.compliance ? prev : current))
      : null

  // Find most broken rule
  const mostBrokenRule =
    data.brokenRules.length > 0
      ? data.brokenRules.reduce((prev, current) => (prev.brokenCount > current.brokenCount ? prev : current))
      : null

  // Calculate compliance trend (last 7 days vs previous 7 days)
  const recentHistory = [...data.complianceHistory].reverse()
  const last7Days = recentHistory.slice(0, 7)
  const previous7Days = recentHistory.slice(7, 14)

  const last7DaysAvg =
    last7Days.length > 0 ? last7Days.reduce((sum, day) => sum + day.compliance, 0) / last7Days.length : 0

  const previous7DaysAvg =
    previous7Days.length > 0 ? previous7Days.reduce((sum, day) => sum + day.compliance, 0) / previous7Days.length : 0

  const complianceTrend = last7DaysAvg - previous7DaysAvg
  const trendDirection = complianceTrend > 0 ? "up" : complianceTrend < 0 ? "down" : "neutral"

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Overall Compliance Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardDescription>Overall Compliance</CardDescription>
          <CardTitle className="text-2xl">{(data.overallCompliance * 100).toFixed(1)}%</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress
            value={data.overallCompliance * 100}
            className="h-2"
            indicatorClassName={
              data.overallCompliance > 0.8
                ? "bg-green-500"
                : data.overallCompliance > 0.5
                  ? "bg-amber-500"
                  : "bg-red-500"
            }
          />
          <div className="mt-2 text-xs text-muted-foreground">Based on {data.totalTrades} trades</div>
        </CardContent>
      </Card>

      {/* Most Followed Strategy Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardDescription>Most Followed Strategy</CardDescription>
          <CardTitle className="text-2xl truncate">
            {mostFollowedStrategy ? mostFollowedStrategy.strategyName : "N/A"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mostFollowedStrategy ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Compliance Rate</span>
                <Badge variant="outline">{(mostFollowedStrategy.compliance * 100).toFixed(0)}%</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Used in {mostFollowedStrategy.totalTrades} trades
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No strategy data available</p>
          )}
        </CardContent>
      </Card>

      {/* Most Broken Rule Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardDescription>Most Broken Rule</CardDescription>
          <CardTitle className="text-lg truncate">{mostBrokenRule ? mostBrokenRule.ruleName : "N/A"}</CardTitle>
        </CardHeader>
        <CardContent>
          {mostBrokenRule ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Break Rate</span>
                <Badge variant="destructive">
                  {((mostBrokenRule.brokenCount / mostBrokenRule.totalCount) * 100).toFixed(0)}%
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Broken {mostBrokenRule.brokenCount} out of {mostBrokenRule.totalCount} times
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No rule data available</p>
          )}
        </CardContent>
      </Card>

      {/* Compliance Trend Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardDescription>Compliance Trend</CardDescription>
          <CardTitle className="flex items-center gap-2">
            <span>{Math.abs(complianceTrend * 100).toFixed(1)}%</span>
            {trendDirection === "up" && <ArrowUpIcon className="h-5 w-5 text-green-500" />}
            {trendDirection === "down" && <ArrowDownIcon className="h-5 w-5 text-red-500" />}
            {trendDirection === "neutral" && <TrendingUpIcon className="h-5 w-5 text-blue-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10">
            <ComplianceTrendChart data={recentHistory.slice(0, 14)} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Last 7 days vs previous 7 days</div>
        </CardContent>
      </Card>
    </div>
  )
}
