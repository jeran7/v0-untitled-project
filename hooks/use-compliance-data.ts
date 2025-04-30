"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export type ComplianceData = {
  overallCompliance: number
  totalTrades: number
  compliantTrades: number
  partiallyCompliantTrades: number
  nonCompliantTrades: number
  complianceByStrategy: {
    strategyId: string
    strategyName: string
    compliance: number
    totalTrades: number
    compliantTrades: number
  }[]
  complianceHistory: {
    date: string
    compliance: number
    trades: number
  }[]
  brokenRules: {
    ruleId: string
    ruleName: string
    strategyName: string
    brokenCount: number
    totalCount: number
  }[]
  ruleImpact: {
    ruleId: string
    ruleName: string
    strategyName: string
    followedWinRate: number
    brokenWinRate: number
    impact: number
  }[]
  performanceByCompliance: {
    complianceLevel: string
    winRate: number
    profitFactor: number
    averageRR: number
    trades: number
  }[]
}

export function useComplianceData(dateRange?: { from: Date; to: Date }) {
  const [data, setData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchComplianceData = async () => {
      try {
        setLoading(true)

        // Fetch trade-strategy compliance data
        const { data: tradeComplianceData, error: tradeComplianceError } = await supabase
          .from("trade_strategy_compliance")
          .select(`
            id,
            trade_id,
            strategy_id,
            compliance_score,
            notes,
            created_at,
            strategies(name),
            trades(
              id,
              entry_date,
              exit_date,
              symbol,
              direction,
              profit_loss,
              win_loss
            )
          `)
          .eq("trades.user_id", user.id)
          .order("created_at", { ascending: false })

        if (tradeComplianceError) throw tradeComplianceError

        // Fetch rule compliance data
        const { data: ruleComplianceData, error: ruleComplianceError } = await supabase.from("rule_compliance").select(`
            id,
            trade_strategy_compliance_id,
            rule_id,
            complied,
            notes,
            strategy_rules(
              id,
              description,
              strategy_id,
              strategies(name)
            )
          `)

        if (ruleComplianceError) throw ruleComplianceError

        // Process data for the dashboard
        if (tradeComplianceData) {
          // Filter by date range if provided
          let filteredTradeData = tradeComplianceData
          if (dateRange) {
            filteredTradeData = tradeComplianceData.filter((item) => {
              const entryDate = new Date(item.trades.entry_date)
              return entryDate >= dateRange.from && entryDate <= dateRange.to
            })
          }

          // Calculate overall compliance
          const totalTrades = filteredTradeData.length
          const compliantTrades = filteredTradeData.filter((item) => item.compliance_score === 1).length
          const partiallyCompliantTrades = filteredTradeData.filter(
            (item) => item.compliance_score > 0 && item.compliance_score < 1,
          ).length
          const nonCompliantTrades = filteredTradeData.filter((item) => item.compliance_score === 0).length
          const overallCompliance =
            totalTrades > 0 ? filteredTradeData.reduce((sum, item) => sum + item.compliance_score, 0) / totalTrades : 0

          // Calculate compliance by strategy
          const strategiesMap = new Map()
          filteredTradeData.forEach((item) => {
            if (!strategiesMap.has(item.strategy_id)) {
              strategiesMap.set(item.strategy_id, {
                strategyId: item.strategy_id,
                strategyName: item.strategies.name,
                totalTrades: 0,
                compliantTrades: 0,
                compliance: 0,
              })
            }

            const strategyData = strategiesMap.get(item.strategy_id)
            strategyData.totalTrades++
            if (item.compliance_score === 1) {
              strategyData.compliantTrades++
            }
            strategyData.compliance = strategyData.compliantTrades / strategyData.totalTrades
          })

          const complianceByStrategy = Array.from(strategiesMap.values())

          // Calculate compliance history
          const dateMap = new Map()
          filteredTradeData.forEach((item) => {
            const date = new Date(item.trades.entry_date).toISOString().split("T")[0]
            if (!dateMap.has(date)) {
              dateMap.set(date, {
                date,
                complianceSum: 0,
                trades: 0,
              })
            }

            const dateData = dateMap.get(date)
            dateData.complianceSum += item.compliance_score
            dateData.trades++
          })

          const complianceHistory = Array.from(dateMap.values())
            .map((item) => ({
              date: item.date,
              compliance: item.complianceSum / item.trades,
              trades: item.trades,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))

          // Calculate broken rules
          const rulesMap = new Map()
          ruleComplianceData.forEach((item) => {
            const tradeCompliance = filteredTradeData.find((tc) => tc.id === item.trade_strategy_compliance_id)

            if (!tradeCompliance) return

            const ruleId = item.rule_id
            const ruleName = item.strategy_rules.description
            const strategyName = item.strategy_rules.strategies.name

            if (!rulesMap.has(ruleId)) {
              rulesMap.set(ruleId, {
                ruleId,
                ruleName,
                strategyName,
                brokenCount: 0,
                totalCount: 0,
              })
            }

            const ruleData = rulesMap.get(ruleId)
            ruleData.totalCount++
            if (!item.complied) {
              ruleData.brokenCount++
            }
          })

          const brokenRules = Array.from(rulesMap.values()).sort((a, b) => b.brokenCount - a.brokenCount)

          // Calculate rule impact
          const ruleImpactMap = new Map()
          ruleComplianceData.forEach((item) => {
            const tradeCompliance = filteredTradeData.find((tc) => tc.id === item.trade_strategy_compliance_id)

            if (!tradeCompliance) return

            const ruleId = item.rule_id
            const ruleName = item.strategy_rules.description
            const strategyName = item.strategy_rules.strategies.name
            const isWin = tradeCompliance.trades.win_loss === "win"

            if (!ruleImpactMap.has(ruleId)) {
              ruleImpactMap.set(ruleId, {
                ruleId,
                ruleName,
                strategyName,
                followedWins: 0,
                followedTrades: 0,
                brokenWins: 0,
                brokenTrades: 0,
              })
            }

            const ruleData = ruleImpactMap.get(ruleId)
            if (item.complied) {
              ruleData.followedTrades++
              if (isWin) ruleData.followedWins++
            } else {
              ruleData.brokenTrades++
              if (isWin) ruleData.brokenWins++
            }
          })

          const ruleImpact = Array.from(ruleImpactMap.values())
            .map((item) => ({
              ruleId: item.ruleId,
              ruleName: item.ruleName,
              strategyName: item.strategyName,
              followedWinRate: item.followedTrades > 0 ? item.followedWins / item.followedTrades : 0,
              brokenWinRate: item.brokenTrades > 0 ? item.brokenWins / item.brokenTrades : 0,
              impact:
                item.followedTrades > 0 && item.brokenTrades > 0
                  ? item.followedWins / item.followedTrades - item.brokenWins / item.brokenTrades
                  : 0,
            }))
            .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

          // Calculate performance by compliance level
          const performanceMap = new Map([
            ["Full (100%)", { wins: 0, trades: 0, profit: 0, loss: 0, rr: 0 }],
            ["High (75-99%)", { wins: 0, trades: 0, profit: 0, loss: 0, rr: 0 }],
            ["Medium (50-74%)", { wins: 0, trades: 0, profit: 0, loss: 0, rr: 0 }],
            ["Low (1-49%)", { wins: 0, trades: 0, profit: 0, loss: 0, rr: 0 }],
            ["None (0%)", { wins: 0, trades: 0, profit: 0, loss: 0, rr: 0 }],
          ])

          filteredTradeData.forEach((item) => {
            let complianceLevel
            if (item.compliance_score === 1) complianceLevel = "Full (100%)"
            else if (item.compliance_score >= 0.75) complianceLevel = "High (75-99%)"
            else if (item.compliance_score >= 0.5) complianceLevel = "Medium (50-74%)"
            else if (item.compliance_score > 0) complianceLevel = "Low (1-49%)"
            else complianceLevel = "None (0%)"

            const levelData = performanceMap.get(complianceLevel)!
            levelData.trades++

            if (item.trades.win_loss === "win") {
              levelData.wins++
              levelData.profit += Number(item.trades.profit_loss)
            } else {
              levelData.loss += Math.abs(Number(item.trades.profit_loss))
            }

            // Calculate R:R if available
            if (item.trades.risk && item.trades.profit_loss) {
              levelData.rr += Number(item.trades.profit_loss) / Number(item.trades.risk)
            }
          })

          const performanceByCompliance = Array.from(performanceMap.entries()).map(([complianceLevel, data]) => ({
            complianceLevel,
            winRate: data.trades > 0 ? data.wins / data.trades : 0,
            profitFactor: data.loss > 0 ? data.profit / data.loss : data.profit > 0 ? Number.POSITIVE_INFINITY : 0,
            averageRR: data.trades > 0 ? data.rr / data.trades : 0,
            trades: data.trades,
          }))

          setData({
            overallCompliance,
            totalTrades,
            compliantTrades,
            partiallyCompliantTrades,
            nonCompliantTrades,
            complianceByStrategy,
            complianceHistory,
            brokenRules,
            ruleImpact,
            performanceByCompliance,
          })
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching compliance data:", err)
        setError(err as Error)
        setLoading(false)
      }
    }

    fetchComplianceData()
  }, [user, dateRange])

  return { data, loading, error }
}
