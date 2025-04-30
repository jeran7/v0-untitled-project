"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, AlertCircle, AlertTriangle, XCircle } from "lucide-react"

interface ComplianceOverviewProps {
  data: {
    totalTrades: number
    tradesWithStrategy: number
    averageCompliance: number
    fullComplianceTrades: number
    highComplianceTrades: number
    mediumComplianceTrades: number
    lowComplianceTrades: number
  } | null
  isLoading: boolean
}

export function ComplianceOverview({ data, isLoading }: ComplianceOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No compliance data available</p>
        </CardContent>
      </Card>
    )
  }

  const strategyUsageRate = data.totalTrades > 0 ? (data.tradesWithStrategy / data.totalTrades) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Average Compliance</CardDescription>
            <CardTitle className="text-2xl">{data.averageCompliance.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={data.averageCompliance} className="h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Strategy Usage</CardDescription>
            <CardTitle className="text-2xl">{strategyUsageRate.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {data.tradesWithStrategy} of {data.totalTrades} trades used a strategy
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Full Compliance</CardDescription>
            <CardTitle className="text-2xl">{data.fullComplianceTrades}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Trades with 100% rule compliance</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Low Compliance</CardDescription>
            <CardTitle className="text-2xl">{data.lowComplianceTrades}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Trades with &lt;50% rule compliance</div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Compliance Distribution</CardTitle>
          <CardDescription>Breakdown of trades by compliance level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Full Compliance (100%)</span>
                </div>
                <span className="text-sm font-medium">{data.fullComplianceTrades}</span>
              </div>
              <Progress
                value={data.tradesWithStrategy > 0 ? (data.fullComplianceTrades / data.tradesWithStrategy) * 100 : 0}
                className="h-2 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm">High Compliance (80-99%)</span>
                </div>
                <span className="text-sm font-medium">{data.highComplianceTrades}</span>
              </div>
              <Progress
                value={data.tradesWithStrategy > 0 ? (data.highComplianceTrades / data.tradesWithStrategy) * 100 : 0}
                className="h-2 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                  <span className="text-sm">Medium Compliance (50-79%)</span>
                </div>
                <span className="text-sm font-medium">{data.mediumComplianceTrades}</span>
              </div>
              <Progress
                value={data.tradesWithStrategy > 0 ? (data.mediumComplianceTrades / data.tradesWithStrategy) * 100 : 0}
                className="h-2 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm">Low Compliance (&lt;50%)</span>
                </div>
                <span className="text-sm font-medium">{data.lowComplianceTrades}</span>
              </div>
              <Progress
                value={data.tradesWithStrategy > 0 ? (data.lowComplianceTrades / data.tradesWithStrategy) * 100 : 0}
                className="h-2 bg-muted/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
