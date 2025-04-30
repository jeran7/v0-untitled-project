"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { DateRangeSelector } from "@/components/analytics/date-range-selector"
import { ComplianceOverview } from "./compliance/compliance-overview"
import { ComplianceByStrategy } from "./compliance/compliance-by-strategy"
import { ComplianceByRule } from "./compliance/compliance-by-rule"
import { ComplianceHistory } from "./compliance/compliance-history"

export function ComplianceDashboard() {
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    to: new Date(),
  })
  const [complianceData, setComplianceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const { toast } = useToast()

  // Fetch compliance data
  useEffect(() => {
    const fetchComplianceData = async () => {
      try {
        setLoading(true)

        // Format dates for query
        const fromDate = dateRange.from.toISOString()
        const toDate = dateRange.to.toISOString()

        // Fetch trades with strategy compliance
        const { data: trades, error: tradesError } = await supabase
          .from("trades")
          .select(`
            id,
            entry_date,
            exit_date,
            symbol,
            direction,
            profit_loss,
            status,
            strategy_id,
            strategies(name, category),
            trade_strategy_compliance(compliance_score, notes)
          `)
          .gte("entry_date", fromDate)
          .lte("entry_date", toDate)
          .not("strategy_id", "is", null)
          .order("entry_date", { ascending: false })

        if (tradesError) throw tradesError

        // Fetch rule compliance data
        const { data: ruleCompliance, error: ruleComplianceError } = await supabase
          .from("rule_compliance")
          .select(`
            id,
            trade_strategy_compliance_id,
            rule_id,
            was_followed,
            notes,
            rules(description, category, priority),
            trade_strategy_compliance(trade_id)
          `)
          .gte("created_at", fromDate)
          .lte("created_at", toDate)

        if (ruleComplianceError) throw ruleComplianceError

        // Process data for dashboard
        const processedData = processComplianceData(trades || [], ruleCompliance || [])
        setComplianceData(processedData)
      } catch (error) {
        console.error("Error fetching compliance data:", error)
        toast({
          title: "Error",
          description: "Failed to load compliance data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchComplianceData()
  }, [dateRange, supabase, toast])

  // Process compliance data for dashboard
  const processComplianceData = (trades: any[], ruleCompliance: any[]) => {
    // Calculate overall compliance
    const totalTrades = trades.length
    const tradesWithCompliance = trades.filter(
      (trade) => trade.trade_strategy_compliance && trade.trade_strategy_compliance.length > 0,
    )
    const complianceScores = tradesWithCompliance.map(
      (trade) => trade.trade_strategy_compliance[0]?.compliance_score || 0,
    )
    const averageCompliance =
      complianceScores.length > 0
        ? complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length
        : 0

    // Calculate compliance by strategy
    const strategiesMap = new Map()
    tradesWithCompliance.forEach((trade) => {
      const strategyId = trade.strategy_id
      const strategyName = trade.strategies?.name || "Unknown"
      const strategyCategory = trade.strategies?.category || "unknown"
      const complianceScore = trade.trade_strategy_compliance[0]?.compliance_score || 0
      const isProfitable = (trade.profit_loss || 0) > 0

      if (!strategiesMap.has(strategyId)) {
        strategiesMap.set(strategyId, {
          id: strategyId,
          name: strategyName,
          category: strategyCategory,
          trades: 0,
          totalCompliance: 0,
          profitableTrades: 0,
          unprofitableTrades: 0,
          profitableCompliance: 0,
          unprofitableCompliance: 0,
        })
      }

      const strategyData = strategiesMap.get(strategyId)
      strategyData.trades += 1
      strategyData.totalCompliance += complianceScore

      if (isProfitable) {
        strategyData.profitableTrades += 1
        strategyData.profitableCompliance += complianceScore
      } else {
        strategyData.unprofitableTrades += 1
        strategyData.unprofitableCompliance += complianceScore
      }
    })

    const strategiesCompliance = Array.from(strategiesMap.values()).map((strategy) => ({
      ...strategy,
      averageCompliance: strategy.trades > 0 ? strategy.totalCompliance / strategy.trades : 0,
      profitableCompliance:
        strategy.profitableTrades > 0 ? strategy.profitableCompliance / strategy.profitableTrades : 0,
      unprofitableCompliance:
        strategy.unprofitableTrades > 0 ? strategy.unprofitableCompliance / strategy.unprofitableTrades : 0,
    }))

    // Calculate compliance by rule
    const rulesMap = new Map()
    ruleCompliance.forEach((compliance) => {
      const ruleId = compliance.rule_id
      const ruleDescription = compliance.rules?.description || "Unknown rule"
      const ruleCategory = compliance.rules?.category || "unknown"
      const rulePriority = compliance.rules?.priority || 3
      const wasFollowed = compliance.was_followed

      if (!rulesMap.has(ruleId)) {
        rulesMap.set(ruleId, {
          id: ruleId,
          description: ruleDescription,
          category: ruleCategory,
          priority: rulePriority,
          totalOccurrences: 0,
          followedCount: 0,
        })
      }

      const ruleData = rulesMap.get(ruleId)
      ruleData.totalOccurrences += 1
      if (wasFollowed) {
        ruleData.followedCount += 1
      }
    })

    const rulesCompliance = Array.from(rulesMap.values()).map((rule) => ({
      ...rule,
      complianceRate: rule.totalOccurrences > 0 ? (rule.followedCount / rule.totalOccurrences) * 100 : 0,
    }))

    // Calculate compliance history (by week)
    const complianceByWeek = new Map()
    tradesWithCompliance.forEach((trade) => {
      const entryDate = new Date(trade.entry_date)
      const weekStart = new Date(entryDate)
      weekStart.setDate(entryDate.getDate() - entryDate.getDay()) // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0)

      const weekKey = weekStart.toISOString().split("T")[0]
      const complianceScore = trade.trade_strategy_compliance[0]?.compliance_score || 0

      if (!complianceByWeek.has(weekKey)) {
        complianceByWeek.set(weekKey, {
          week: weekKey,
          trades: 0,
          totalCompliance: 0,
        })
      }

      const weekData = complianceByWeek.get(weekKey)
      weekData.trades += 1
      weekData.totalCompliance += complianceScore
    })

    const complianceHistory = Array.from(complianceByWeek.values())
      .map((week) => ({
        ...week,
        averageCompliance: week.trades > 0 ? week.totalCompliance / week.trades : 0,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))

    return {
      overview: {
        totalTrades,
        tradesWithStrategy: tradesWithCompliance.length,
        averageCompliance,
        fullComplianceTrades: complianceScores.filter((score) => score === 100).length,
        highComplianceTrades: complianceScores.filter((score) => score >= 80 && score < 100).length,
        mediumComplianceTrades: complianceScores.filter((score) => score >= 50 && score < 80).length,
        lowComplianceTrades: complianceScores.filter((score) => score < 50).length,
      },
      strategiesCompliance,
      rulesCompliance,
      complianceHistory,
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Strategy Compliance</h2>
          <p className="text-muted-foreground">Analyze how well your trades follow your trading strategies</p>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategies">By Strategy</TabsTrigger>
          <TabsTrigger value="rules">By Rule</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ComplianceOverview data={complianceData?.overview} isLoading={loading} />
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <ComplianceByStrategy data={complianceData?.strategiesCompliance} isLoading={loading} />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <ComplianceByRule data={complianceData?.rulesCompliance} isLoading={loading} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ComplianceHistory data={complianceData?.complianceHistory} isLoading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
