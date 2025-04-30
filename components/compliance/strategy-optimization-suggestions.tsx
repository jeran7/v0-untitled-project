"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import type { ComplianceData } from "@/hooks/use-compliance-data"

interface StrategyOptimizationSuggestionsProps {
  data: ComplianceData | null
  loading: boolean
}

export function StrategyOptimizationSuggestions({ data, loading }: StrategyOptimizationSuggestionsProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all")

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Strategy Optimization Suggestions</CardTitle>
          <CardDescription>Data-driven recommendations to improve your trading strategies</CardDescription>
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
          <CardTitle>Strategy Optimization Suggestions</CardTitle>
          <CardDescription>Data-driven recommendations to improve your trading strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No strategy data available for optimization suggestions</p>
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

  // Generate optimization suggestions
  const criticalRules = filteredRules
    .filter((rule) => Math.abs(rule.impact) >= 0.15)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

  const potentiallyUnnecessaryRules = filteredRules.filter(
    (rule) =>
      Math.abs(rule.impact) < 0.05 &&
      rule.followedWinRate > 0 &&
      rule.brokenWinRate > 0 &&
      Math.abs(rule.followedWinRate - rule.brokenWinRate) < 0.05,
  )

  const rulesToReview = filteredRules.filter((rule) => rule.impact < -0.1 && rule.brokenWinRate > rule.followedWinRate)

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Strategy Optimization Suggestions</CardTitle>
            <CardDescription>Data-driven recommendations to improve your trading strategies</CardDescription>
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
      <CardContent className="space-y-6">
        {/* Critical Rules Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-medium">Critical Rules to Focus On</h3>
          </div>

          {criticalRules.length > 0 ? (
            <div className="space-y-3">
              {criticalRules.map((rule, index) => (
                <div
                  key={`critical-${index}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card/30 p-3 backdrop-blur-sm"
                >
                  {rule.impact > 0 ? (
                    <ArrowUpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  ) : (
                    <ArrowDownCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.ruleName}</span>
                      <Badge variant={rule.impact > 0 ? "success" : "destructive"}>
                        {Math.abs(rule.impact * 100).toFixed(1)}% Impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rule.impact > 0 ? (
                        <>
                          Following this rule significantly improves your win rate by{" "}
                          {(Math.abs(rule.impact) * 100).toFixed(1)}%. Make this rule a priority in your trading plan.
                        </>
                      ) : (
                        <>
                          Breaking this rule is associated with a {(Math.abs(rule.impact) * 100).toFixed(1)}% decrease
                          in win rate. Focus on consistently following this rule.
                        </>
                      )}
                    </p>
                    <div className="text-xs text-muted-foreground">Strategy: {rule.strategyName}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No critical rules identified. Continue collecting data to identify high-impact rules.
            </p>
          )}
        </div>

        {/* Rules to Review Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-medium">Rules to Review</h3>
          </div>

          {rulesToReview.length > 0 ? (
            <div className="space-y-3">
              {rulesToReview.map((rule, index) => (
                <div
                  key={`review-${index}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card/30 p-3 backdrop-blur-sm"
                >
                  <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.ruleName}</span>
                      <Badge variant="outline">Needs Review</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Surprisingly, your win rate is{" "}
                      {(Math.abs(rule.brokenWinRate - rule.followedWinRate) * 100).toFixed(1)}% higher when you break
                      this rule. Consider reviewing and potentially modifying this rule.
                    </p>
                    <div className="text-xs text-muted-foreground">Strategy: {rule.strategyName}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No rules need immediate review. Your rule set appears to be working as expected.
            </p>
          )}
        </div>

        {/* Potentially Unnecessary Rules Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Potentially Unnecessary Rules</h3>
          </div>

          {potentiallyUnnecessaryRules.length > 0 ? (
            <div className="space-y-3">
              {potentiallyUnnecessaryRules.map((rule, index) => (
                <div
                  key={`unnecessary-${index}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card/30 p-3 backdrop-blur-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.ruleName}</span>
                      <Badge variant="outline">Low Impact</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This rule shows minimal impact on your trading results. Following or breaking it doesn't
                      significantly affect your win rate. Consider simplifying your strategy by making this rule
                      optional or removing it.
                    </p>
                    <div className="text-xs text-muted-foreground">Strategy: {rule.strategyName}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              All your rules appear to have meaningful impact on your trading results. No unnecessary rules identified.
            </p>
          )}
        </div>

        {/* General Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-medium">General Recommendations</h3>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card/30 p-3 backdrop-blur-sm">
              <p className="text-sm">
                {selectedStrategy === "all" ? (
                  <>
                    Focus on consistently following your high-impact rules across all strategies. Your data shows that
                    compliance with critical rules significantly improves your trading results.
                  </>
                ) : (
                  <>
                    For your <span className="font-medium">{selectedStrategy}</span> strategy, prioritize rule
                    compliance to maximize performance. The data shows a strong correlation between strategy adherence
                    and positive outcomes.
                  </>
                )}
              </p>
            </div>

            {data.performanceByCompliance.some((item) => item.complianceLevel === "Full (100%)" && item.trades > 0) && (
              <div className="rounded-lg border border-border bg-card/30 p-3 backdrop-blur-sm">
                <p className="text-sm">
                  Trades with 100% compliance show
                  {data.performanceByCompliance.find((item) => item.complianceLevel === "Full (100%)")!.winRate >
                  data.performanceByCompliance.find((item) => item.complianceLevel === "Low (1-49%)")!.winRate ? (
                    <> significantly better results than low-compliance trades. </>
                  ) : (
                    <> similar results to low-compliance trades. This suggests your strategy may need refinement. </>
                  )}
                  Continue to track and analyze your compliance data to refine your approach.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
