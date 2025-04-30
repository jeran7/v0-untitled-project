"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { ComplianceData } from "@/hooks/use-compliance-data"

interface RuleComplianceBreakdownProps {
  data: ComplianceData | null
  isLoading: boolean
}

export function RuleComplianceBreakdown({ data, isLoading }: RuleComplianceBreakdownProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all")

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Rule Compliance Breakdown</CardTitle>
          <CardDescription>Analysis of how well you follow specific rules</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.brokenRules.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Rule Compliance Breakdown</CardTitle>
          <CardDescription>Analysis of how well you follow specific rules</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No rule compliance data available</p>
        </CardContent>
      </Card>
    )
  }

  // Get unique strategies from broken rules
  const strategies = Array.from(new Set(data.brokenRules.map((rule) => rule.strategyName)))

  // Filter rules by selected strategy
  const filteredRules =
    selectedStrategy === "all"
      ? data.brokenRules
      : data.brokenRules.filter((rule) => rule.strategyName === selectedStrategy)

  // Prepare data for chart
  const chartData = filteredRules
    .map((rule) => ({
      name: rule.ruleName.length > 30 ? rule.ruleName.substring(0, 30) + "..." : rule.ruleName,
      complianceRate: ((rule.totalCount - rule.brokenCount) / rule.totalCount) * 100,
      brokenRate: (rule.brokenCount / rule.totalCount) * 100,
      totalCount: rule.totalCount,
      brokenCount: rule.brokenCount,
      fullName: rule.ruleName,
    }))
    .sort((a, b) => a.complianceRate - b.complianceRate) // Sort by compliance rate (ascending)

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Rule Compliance Breakdown</CardTitle>
          <CardDescription>Analysis of how well you follow specific rules</CardDescription>
        </div>
        <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
          <SelectTrigger className="w-[180px]">
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
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "complianceRate") return [`${value.toFixed(1)}%`, "Compliance Rate"]
                  if (name === "brokenRate") return [`${value.toFixed(1)}%`, "Broken Rate"]
                  return [value, name]
                }}
                labelFormatter={(value) => chartData[value]?.fullName || ""}
              />
              <Bar dataKey="complianceRate" name="Followed" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="brokenRate" name="Broken" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 space-y-4">
          <h4 className="font-medium">Most Frequently Broken Rules</h4>
          <div className="space-y-2">
            {filteredRules
              .sort((a, b) => b.brokenCount - a.brokenCount)
              .slice(0, 3)
              .map((rule) => (
                <div key={rule.ruleId} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                  <div className="flex-1">
                    <p className="font-medium">{rule.ruleName}</p>
                    <p className="text-sm text-muted-foreground">{rule.strategyName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      Broken {rule.brokenCount} of {rule.totalCount} times
                    </Badge>
                    <Badge variant="outline">{((rule.brokenCount / rule.totalCount) * 100).toFixed(0)}%</Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
