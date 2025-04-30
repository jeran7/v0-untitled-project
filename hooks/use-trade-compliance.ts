"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export type RuleCompliance = {
  ruleId: string
  complied: boolean
  notes: string
}

export type TradeCompliance = {
  tradeId: string
  strategyId: string
  complianceScore: number
  notes: string
  ruleCompliance: RuleCompliance[]
}

export function useTradeCompliance() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  const saveTradeCompliance = async (compliance: TradeCompliance) => {
    if (!user) return null

    try {
      setLoading(true)
      setError(null)

      // Insert trade-strategy compliance record
      const { data: tradeComplianceData, error: tradeComplianceError } = await supabase
        .from("trade_strategy_compliance")
        .insert({
          trade_id: compliance.tradeId,
          strategy_id: compliance.strategyId,
          compliance_score: compliance.complianceScore,
          notes: compliance.notes,
        })
        .select("id")
        .single()

      if (tradeComplianceError) throw tradeComplianceError

      // Insert rule compliance records
      if (tradeComplianceData && compliance.ruleCompliance.length > 0) {
        const ruleComplianceRecords = compliance.ruleCompliance.map((rule) => ({
          trade_strategy_compliance_id: tradeComplianceData.id,
          rule_id: rule.ruleId,
          complied: rule.complied,
          notes: rule.notes,
        }))

        const { error: ruleComplianceError } = await supabase.from("rule_compliance").insert(ruleComplianceRecords)

        if (ruleComplianceError) throw ruleComplianceError
      }

      setLoading(false)
      return tradeComplianceData
    } catch (err) {
      console.error("Error saving trade compliance:", err)
      setError(err as Error)
      setLoading(false)
      return null
    }
  }

  const getTradeCompliance = async (tradeId: string) => {
    if (!user) return null

    try {
      setLoading(true)
      setError(null)

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
        return null
      }

      // Fetch rule compliance records
      const { data: ruleComplianceData, error: ruleComplianceError } = await supabase
        .from("rule_compliance")
        .select(`
          id,
          rule_id,
          complied,
          notes,
          strategy_rules(
            id,
            description
          )
        `)
        .eq("trade_strategy_compliance_id", tradeComplianceData.id)

      if (ruleComplianceError) throw ruleComplianceError

      const compliance: TradeCompliance = {
        tradeId: tradeComplianceData.trade_id,
        strategyId: tradeComplianceData.strategy_id,
        complianceScore: tradeComplianceData.compliance_score,
        notes: tradeComplianceData.notes,
        ruleCompliance: ruleComplianceData
          ? ruleComplianceData.map((rule) => ({
              ruleId: rule.rule_id,
              complied: rule.complied,
              notes: rule.notes,
            }))
          : [],
      }

      setLoading(false)
      return {
        compliance,
        strategy: tradeComplianceData.strategies,
        rules: ruleComplianceData
          ? ruleComplianceData.map((rule) => ({
              id: rule.rule_id,
              description: rule.strategy_rules.description,
              complied: rule.complied,
              notes: rule.notes,
            }))
          : [],
      }
    } catch (err) {
      console.error("Error fetching trade compliance:", err)
      setError(err as Error)
      setLoading(false)
      return null
    }
  }

  const updateTradeCompliance = async (compliance: TradeCompliance) => {
    if (!user) return null

    try {
      setLoading(true)
      setError(null)

      // Check if trade compliance record exists
      const { data: existingCompliance, error: checkError } = await supabase
        .from("trade_strategy_compliance")
        .select("id")
        .eq("trade_id", compliance.tradeId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      let tradeComplianceId

      if (existingCompliance) {
        // Update existing record
        const { data: updatedCompliance, error: updateError } = await supabase
          .from("trade_strategy_compliance")
          .update({
            strategy_id: compliance.strategyId,
            compliance_score: compliance.complianceScore,
            notes: compliance.notes,
          })
          .eq("id", existingCompliance.id)
          .select("id")
          .single()

        if (updateError) throw updateError
        tradeComplianceId = existingCompliance.id

        // Delete existing rule compliance records
        const { error: deleteError } = await supabase
          .from("rule_compliance")
          .delete()
          .eq("trade_strategy_compliance_id", tradeComplianceId)

        if (deleteError) throw deleteError
      } else {
        // Insert new record
        const { data: newCompliance, error: insertError } = await supabase
          .from("trade_strategy_compliance")
          .insert({
            trade_id: compliance.tradeId,
            strategy_id: compliance.strategyId,
            compliance_score: compliance.complianceScore,
            notes: compliance.notes,
          })
          .select("id")
          .single()

        if (insertError) throw insertError
        tradeComplianceId = newCompliance.id
      }

      // Insert rule compliance records
      if (tradeComplianceId && compliance.ruleCompliance.length > 0) {
        const ruleComplianceRecords = compliance.ruleCompliance.map((rule) => ({
          trade_strategy_compliance_id: tradeComplianceId,
          rule_id: rule.ruleId,
          complied: rule.complied,
          notes: rule.notes,
        }))

        const { error: ruleComplianceError } = await supabase.from("rule_compliance").insert(ruleComplianceRecords)

        if (ruleComplianceError) throw ruleComplianceError
      }

      setLoading(false)
      return { id: tradeComplianceId }
    } catch (err) {
      console.error("Error updating trade compliance:", err)
      setError(err as Error)
      setLoading(false)
      return null
    }
  }

  return {
    saveTradeCompliance,
    getTradeCompliance,
    updateTradeCompliance,
    loading,
    error,
  }
}
