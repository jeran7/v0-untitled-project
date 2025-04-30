"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TradeStrategyConnection } from "@/components/trade-strategy/trade-strategy-connection"
import { TradeComplianceAnalysis } from "@/components/trade-compliance-analysis"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { ComplianceData } from "@/components/trade-strategy/trade-strategy-connection"

interface TradeStrategyDetailsProps {
  tradeId: string
}

export function TradeStrategyDetails({ tradeId }: TradeStrategyDetailsProps) {
  const [strategyId, setStrategyId] = useState<string | null>(null)
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch trade strategy and compliance data
  useEffect(() => {
    const fetchTradeStrategyData = async () => {
      try {
        setLoading(true)

        // Fetch trade-strategy compliance record
        const { data: tradeComplianceData, error: tradeComplianceError } = await supabase
          .from("trade_strategy_compliance")
          .select(`
            id,
            trade_id,
            strategy_id,
            compliance_score,
            notes,
            strategies(
              id,
              name,
              description
            )
          `)
          .eq("trade_id", tradeId)
          .single()

        if (tradeComplianceError && tradeComplianceError.code !== "PGRST116") {
          // PGRST116 is "no rows returned" error, which is fine
          throw tradeComplianceError
        }

        if (!tradeComplianceData) {
          setLoading(false)
          return
        }

        setStrategyId(tradeComplianceData.strategy_id)

        // Fetch rule compliance records
        const { data: ruleComplianceData, error: ruleComplianceError } = await supabase
          .from("rule_compliance")
          .select(`
            id,
            rule_id,
            was_followed,
            notes,
            rules(
              id,
              description
            )
          `)
          .eq("trade_strategy_compliance_id", tradeComplianceData.id)

        if (ruleComplianceError) throw ruleComplianceError

        // Calculate followed rules
        const totalRules = ruleComplianceData?.length || 0
        const followedRules = ruleComplianceData?.filter((r) => r.was_followed).length || 0

        // Create compliance data
        const compliance: ComplianceData = {
          score: tradeComplianceData.compliance_score || 0,
          followedRules,
          totalRules,
          ruleCompliance: ruleComplianceData
            ? ruleComplianceData.map((rule) => ({
                ruleId: rule.rule_id,
                followed: rule.was_followed,
                notes: rule.notes,
              }))
            : [],
          notes: tradeComplianceData.notes || "",
        }

        setComplianceData(compliance)
      } catch (err: any) {
        console.error("Error fetching trade strategy data:", err)
        toast({
          title: "Error",
          description: "Failed to load strategy data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTradeStrategyData()
  }, [tradeId, toast])

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Strategy & Compliance</CardTitle>
        <CardDescription>Strategy details and rule compliance for this trade</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="bg-secondary/30">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <TradeComplianceAnalysis tradeId={tradeId} strategyId={strategyId} complianceData={complianceData} />
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <TradeStrategyConnection
              tradeId={tradeId}
              initialStrategyId={strategyId}
              initialCompliance={complianceData}
              readOnly={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
