"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StrategySelector } from "@/components/trade-strategy/strategy-selector"
import { StrategyRuleChecklist } from "@/components/trade-strategy/strategy-rule-checklist"
import { ComplianceScore } from "@/components/trade-strategy/compliance-score"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { Strategy } from "@/types/database"

export interface TradeStrategyConnectionProps {
  tradeId?: string
  initialStrategyId?: string | null
  initialCompliance?: ComplianceData | null
  onStrategyChange?: (strategyId: string | null, strategy: Strategy | null) => void
  onComplianceChange?: (compliance: ComplianceData) => void
  readOnly?: boolean
}

export interface ComplianceData {
  score: number
  followedRules: number
  totalRules: number
  ruleCompliance: {
    ruleId: string
    followed: boolean
    notes?: string
  }[]
  notes: string
}

export function TradeStrategyConnection({
  tradeId,
  initialStrategyId = null,
  initialCompliance = null,
  onStrategyChange,
  onComplianceChange,
  readOnly = false,
}: TradeStrategyConnectionProps) {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(initialStrategyId)
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(initialCompliance)
  const [activeTab, setActiveTab] = useState<string>("strategy")
  const { toast } = useToast()

  // Handle strategy change
  const handleStrategyChange = (strategyId: string | null, strategy: Strategy | null) => {
    setSelectedStrategyId(strategyId)
    setSelectedStrategy(strategy)
    if (onStrategyChange) {
      onStrategyChange(strategyId, strategy)
    }

    // If we're changing strategy, move to the compliance tab
    if (strategyId && !readOnly) {
      setActiveTab("compliance")
    }
  }

  // Handle compliance change
  const handleComplianceChange = (compliance: ComplianceData) => {
    setComplianceData(compliance)
    if (onComplianceChange) {
      onComplianceChange(compliance)
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <Card className="glass-card border border-border/40 backdrop-blur-2xl bg-background/90">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <CardTitle>Strategy Connection</CardTitle>
              <CardDescription>Connect this trade to a strategy from your playbook</CardDescription>
            </div>
            {complianceData && (
              <ComplianceScore
                score={complianceData.score}
                followedRules={complianceData.followedRules}
                totalRules={complianceData.totalRules}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-secondary/30 w-full grid grid-cols-2">
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="compliance" disabled={!selectedStrategyId}>
                Compliance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="strategy" className="mt-4 space-y-4">
              <StrategySelector
                selectedStrategyId={selectedStrategyId}
                onStrategyChange={handleStrategyChange}
                readOnly={readOnly}
              />

              {!readOnly && (
                <div className="flex justify-center mt-6">
                  <Button variant="outline" className="gap-2" asChild>
                    <Link href="/playbook/new">
                      <PlusCircle className="h-4 w-4" />
                      Create New Strategy
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="compliance" className="mt-4">
              {selectedStrategyId ? (
                <StrategyRuleChecklist
                  strategyId={selectedStrategyId}
                  initialCompliance={initialCompliance}
                  onComplianceChange={handleComplianceChange}
                  readOnly={readOnly}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg border-border/50">
                  <p className="text-muted-foreground">Select a strategy first to view compliance checklist</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
