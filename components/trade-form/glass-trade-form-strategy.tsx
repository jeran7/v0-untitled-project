"use client"

import { useState } from "react"
import { GlassTradeStrategyConnection } from "@/components/trade-strategy/glass-trade-strategy-connection"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface Rule {
  id: string
  description: string
  isCritical: boolean
  isFollowed: boolean
  note: string
}

interface TradeFormStrategyProps {
  tradeId?: string
  onUpdate?: (data: { strategyId: string; rules: Rule[] }) => void
  initialStrategyId?: string
  initialRules?: Rule[]
}

export function GlassTradeFormStrategy({
  tradeId,
  onUpdate,
  initialStrategyId,
  initialRules = [],
}: TradeFormStrategyProps) {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | undefined>(initialStrategyId)
  const [rules, setRules] = useState<Rule[]>(initialRules)
  const { toast } = useToast()

  // Handle strategy selection
  const handleStrategySelect = (strategyId: string) => {
    setSelectedStrategyId(strategyId)
    if (onUpdate) {
      onUpdate({ strategyId, rules })
    }

    toast({
      title: "Strategy Selected",
      description: "The trading strategy has been successfully connected to this trade.",
    })
  }

  // Handle rules update
  const handleRulesUpdate = (updatedRules: Rule[]) => {
    setRules(updatedRules)
    if (onUpdate && selectedStrategyId) {
      onUpdate({ strategyId: selectedStrategyId, rules: updatedRules })
    }
  }

  // Calculate compliance score
  const followedRules = rules.filter((rule) => rule.isFollowed).length
  const totalRules = rules.length
  const compliancePercentage = totalRules > 0 ? Math.round((followedRules / totalRules) * 100) : 0

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-gray-800 shadow-lg overflow-hidden">
        <CardHeader className="bg-black/40 border-b border-gray-800">
          <CardTitle className="text-white flex items-center justify-between">
            <span>Strategy & Rule Compliance</span>
            {selectedStrategyId && totalRules > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-gray-400">Compliance Score:</span>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    compliancePercentage >= 80
                      ? "bg-green-900/40 border border-green-700 text-green-200 glow-green"
                      : compliancePercentage >= 50
                        ? "bg-yellow-900/40 border border-yellow-700 text-yellow-200"
                        : "bg-red-900/40 border border-red-700 text-red-200 glow-red"
                  }`}
                >
                  {compliancePercentage}% ({followedRules}/{totalRules})
                </div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <GlassTradeStrategyConnection
            tradeId={tradeId}
            onStrategySelect={handleStrategySelect}
            onRulesUpdate={handleRulesUpdate}
            selectedStrategyId={selectedStrategyId}
            initialRules={initialRules}
          />

          {selectedStrategyId && (
            <div className="mt-6 flex justify-end">
              <Button
                className="glass-button pulse-on-hover text-white"
                onClick={() => {
                  if (onUpdate && selectedStrategyId) {
                    onUpdate({ strategyId: selectedStrategyId, rules })
                    toast({
                      title: "Compliance Updated",
                      description: `Compliance score: ${compliancePercentage}% (${followedRules}/${totalRules} rules followed)`,
                    })
                  }
                }}
              >
                Save Compliance Data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
