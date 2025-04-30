"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import type { ComplianceData } from "@/hooks/use-compliance-data"

interface RuleImpactAnalysisProps {
  data: ComplianceData | null
  loading: boolean
}

export function RuleImpactAnalysis({ data, loading }: RuleImpactAnalysisProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all")

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Rule Impact Analysis</CardTitle>
          <CardDescription>Analyze how each rule affects your trading performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.ruleImpact.length) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Rule Impact Analysis</CardTitle>
          <CardDescription>Analyze how each rule affects your trading performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No rule impact data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get unique strategies
  const strategies = Array.from(new Set(data.ruleImpact.map((rule) => rule.strategyName)))

  // Filter rules by selected strategy
  const filteredRules =
    selectedStrategy === "all"
      ? data.ruleImpact
      : data.ruleImpact.filter((rule) => rule.strategyName === selectedStrategy)

  // Sort rules by impact (absolute value, descending)
  const sortedRules = [...filteredRules].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Rule Impact Analysis</CardTitle>
            <CardDescription>Analyze how each rule affects your trading performance</CardDescription>
          </div>
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategies</SelectItem>
              {strategies.map((strategy) => (
                <SelectItem key={strategy} value={strategy}>
                  {strategy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="impact">
          <TabsList className="glass-card grid w-full grid-cols-2">
            <TabsTrigger value="impact">Impact Score</TabsTrigger>
            <TabsTrigger value="winrate">Win Rate Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="impact" className="mt-4">
            <div className="space-y-6">
              {sortedRules.map((rule, index) => {
                const impactPercentage = rule.impact * 100
                const isPositive = rule.impact > 0
                const impactMagnitude = Math.abs(rule.impact)

                let impactLevel = "neutral"
                if (impactMagnitude >= 0.2) impactLevel = isPositive ? "high-positive" : "high-negative"
                else if (impactMagnitude >= 0.1) impactLevel = isPositive ? "medium-positive" : "medium-negative"
                else if (impactMagnitude > 0) impactLevel = isPositive ? "low-positive" : "low-negative"

                return (
                  <div key={`${rule.ruleId}-${index}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium">{rule.ruleName}</span>
                        <span className="text-xs text-muted-foreground">{rule.strategyName}</span>
                      </div>
                      <Badge
                        variant={
                          impactLevel === "high-positive"
                            ? "success"
                            : impactLevel === "medium-positive"
                              ? "success"
                              : impactLevel === "low-positive"
                                ? "outline"
                                : impactLevel === "high-negative"
                                  ? "destructive"
                                  : impactLevel === "medium-negative"
                                    ? "destructive"
                                    : impactLevel === "low-negative"
                                      ? "outline"
                                      : "outline"
                        }
                      >
                        {impactPercentage.toFixed(1)}% {isPositive ? "Positive" : "Negative"} Impact
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-full">
                        <Progress
                          value={50 + impactPercentage / 2}
                          max={100}
                          className="h-2 bg-gray-700"
                          indicatorClassName={
                            impactLevel === "high-positive"
                              ? "bg-green-500"
                              : impactLevel === "medium-positive"
                                ? "bg-green-400"
                                : impactLevel === "low-positive"
                                  ? "bg-green-300"
                                  : impactLevel === "high-negative"
                                    ? "bg-red-500"
                                    : impactLevel === "medium-negative"
                                      ? "bg-red-400"
                                      : impactLevel === "low-negative"
                                        ? "bg-red-300"
                                        : "bg-gray-400"
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Negative Impact</span>
                      <span>Neutral</span>
                      <span>Positive Impact</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="winrate" className="mt-4">
            <div className="space-y-6">
              {sortedRules.map((rule, index) => (
                <div key={`${rule.ruleId}-${index}-winrate`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium">{rule.ruleName}</span>
                      <span className="text-xs text-muted-foreground">{rule.strategyName}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">When Rule Followed</span>
                        <span className="font-medium">{(rule.followedWinRate * 100).toFixed(1)}% Win Rate</span>
                      </div>
                      <Progress value={rule.followedWinRate * 100} className="h-2" indicatorClassName="bg-green-500" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">When Rule Broken</span>
                        <span className="font-medium">{(rule.brokenWinRate * 100).toFixed(1)}% Win Rate</span>
                      </div>
                      <Progress value={rule.brokenWinRate * 100} className="h-2" indicatorClassName="bg-red-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
