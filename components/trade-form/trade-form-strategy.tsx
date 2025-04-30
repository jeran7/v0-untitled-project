"use client"

import { useState, useEffect } from "react"
import { TradeStrategyConnection, type ComplianceData } from "@/components/trade-strategy/trade-strategy-connection"

interface TradeFormStrategyProps {
  form: any
  initialStrategyId?: string | null
  initialCompliance?: ComplianceData | null
}

export function TradeFormStrategy({
  form,
  initialStrategyId = null,
  initialCompliance = null,
}: TradeFormStrategyProps) {
  const [strategyId, setStrategyId] = useState<string | null>(initialStrategyId)
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(initialCompliance)

  // Update form data when strategy or compliance changes
  useEffect(() => {
    if (form) {
      form.setValue("strategyId", strategyId)
    }
  }, [strategyId, form])

  useEffect(() => {
    if (form && complianceData) {
      form.setValue("compliance", complianceData)
    }
  }, [complianceData, form])

  const handleStrategyChange = (newStrategyId: string | null) => {
    setStrategyId(newStrategyId)
  }

  const handleComplianceChange = (compliance: ComplianceData) => {
    setComplianceData(compliance)
  }

  return (
    <div className="space-y-6">
      <TradeStrategyConnection
        initialStrategyId={strategyId}
        initialCompliance={complianceData}
        onStrategyChange={handleStrategyChange}
        onComplianceChange={handleComplianceChange}
      />
    </div>
  )
}
