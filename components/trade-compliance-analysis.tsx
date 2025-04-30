"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Strategy, Rule } from "@/types/database"
import type { ComplianceData } from "./trade-form/trade-form-compliance-checklist"

interface TradeComplianceAnalysisProps {
  tradeId: string
  strategyId: string | null
  complianceData?: ComplianceData
}

export function TradeComplianceAnalysis({ tradeId, strategyId, complianceData }: TradeComplianceAnalysisProps) {
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const { toast } = useToast()

  // Fetch strategy and rules
  useEffect(() => {
    const fetchStrategyAndRules = async () => {
      if (!strategyId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Fetch strategy
        const { data: strategyData, error: strategyError } = await supabase
          .from("strategies")
          .select("*")
          .eq("id", strategyId)
          .single()

        if (strategyError) throw strategyError
        setStrategy(strategyData)

        // Fetch rules
        const { data: rulesData, error: rulesError } = await supabase
          .from("rules")
          .select("*")
          .eq("strategy_id", strategyId)
          .order("order_index")

        if (rulesError) throw rulesError
        setRules(rulesData || [])
      } catch (error) {
        console.error("Error fetching strategy and rules:", error)
        toast({
          title: "Error",
          description: "Failed to load strategy details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStrategyAndRules()
  }, [strategyId, supabase, toast])

  // Group rules by category
  const groupedRules = rules.reduce(
    (acc, rule) => {
      if (!acc[rule.category]) {
        acc[rule.category] = []
      }
      acc[rule.category].push(rule)
      return acc
    },
    {} as Record<string, Rule[]>,
  )

  // Format category name
  const formatCategoryName = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Get priority color
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "text-red-500"
      case 2:
        return "text-amber-500"
      case 3:
        return "text-blue-500"
      default:
        return "text-muted-foreground"
    }
  }

  // Get priority label
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return "Critical"
      case 2:
        return "Important"
      case 3:
        return "Optional"
      default:
        return "Unknown"
    }
  }

  // Get compliance status for a rule
  const getRuleCompliance = (ruleId: string) => {
    if (!complianceData) return false
    const ruleCompliance = complianceData.ruleCompliance.find((rc) => rc.ruleId === ruleId)
    return ruleCompliance?.followed || false
  }

  // Get compliance notes for a rule
  const getRuleNotes = (ruleId: string) => {
    if (!complianceData) return ""
    const ruleCompliance = complianceData.ruleCompliance.find((rc) => rc.ruleId === ruleId)
    return ruleCompliance?.notes || ""
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="h-12 bg-muted rounded"></div>
        <div className="h-12 bg-muted rounded"></div>
        <div className="h-12 bg-muted rounded"></div>
      </div>
    )
  }

  if (!strategyId || !strategy) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <Info className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No strategy associated with this trade</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Strategy Compliance</CardTitle>
            <CardDescription>Analysis of how well this trade followed the strategy</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{complianceData?.score || 0}%</span>
            <Progress value={complianceData?.score || 0} className="w-24 h-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-background/30 backdrop-blur-md border border-border/50">
          <div className="flex items-center gap-3">
            {complianceData?.score && complianceData.score >= 80 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="font-medium">
                {complianceData?.score && complianceData.score >= 80
                  ? "Good strategy compliance"
                  : complianceData?.score && complianceData.score >= 50
                    ? "Moderate strategy compliance"
                    : "Poor strategy compliance"}
              </p>
              <p className="text-sm text-muted-foreground">
                {complianceData?.score && complianceData.score >= 80
                  ? "This trade followed most of the strategy rules."
                  : complianceData?.score && complianceData.score >= 50
                    ? "This trade followed some of the strategy rules."
                    : "This trade followed few of the strategy rules."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Strategy: {strategy.name}</h3>
          <p className="text-sm text-muted-foreground">{strategy.description}</p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-background/50">
              {formatCategoryName(strategy.category)}
            </Badge>
            {strategy.timeframes?.map((timeframe) => (
              <Badge key={timeframe} variant="outline" className="bg-background/50">
                {timeframe}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Rule Compliance</h3>

          {Object.entries(groupedRules).map(([category, categoryRules]) => (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-sm">{formatCategoryName(category)}</h4>
              <div className="space-y-3">
                {categoryRules.map((rule) => {
                  const isFollowed = getRuleCompliance(rule.id)
                  const notes = getRuleNotes(rule.id)

                  return (
                    <div
                      key={rule.id}
                      className={`p-3 rounded-lg border ${
                        isFollowed ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isFollowed ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium">{rule.description}</p>
                            <div className={`flex items-center gap-1 text-xs ${getPriorityColor(rule.priority)}`}>
                              <span>{getPriorityLabel(rule.priority)}</span>
                            </div>
                          </div>

                          {!isFollowed && notes && (
                            <div className="mt-2 p-2 rounded bg-background/50 text-sm">
                              <p className="text-xs text-muted-foreground mb-1">Why rule wasn't followed:</p>
                              <p>{notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {complianceData?.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Compliance Notes</h3>
              <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                <p className="text-sm">{complianceData.notes}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
