"use client"

import { useState } from "react"
import type { Strategy } from "@/types/playbook"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { BookOpen, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Rule {
  id: string
  description: string
  isCritical: boolean
  isFollowed: boolean
  note?: string
}

interface TradeStrategyDetailsProps {
  strategy: Strategy
  rules: Rule[]
}

export function GlassTradeStrategyDetails({ strategy, rules }: TradeStrategyDetailsProps) {
  const [isRulesOpen, setIsRulesOpen] = useState(true)

  // Calculate compliance score
  const followedRules = rules.filter((rule) => rule.isFollowed).length
  const totalRules = rules.length
  const compliancePercentage = totalRules > 0 ? Math.round((followedRules / totalRules) * 100) : 0

  // Calculate critical rules compliance
  const criticalRules = rules.filter((rule) => rule.isCritical)
  const followedCriticalRules = criticalRules.filter((rule) => rule.isFollowed).length
  const criticalCompliancePercentage =
    criticalRules.length > 0 ? Math.round((followedCriticalRules / criticalRules.length) * 100) : 100

  // Determine compliance status
  const getComplianceStatus = () => {
    if (compliancePercentage >= 80) return { color: "text-green-400", icon: CheckCircle, text: "High Compliance" }
    if (compliancePercentage >= 50)
      return { color: "text-yellow-400", icon: AlertTriangle, text: "Moderate Compliance" }
    return { color: "text-red-400", icon: XCircle, text: "Low Compliance" }
  }

  const complianceStatus = getComplianceStatus()
  const ComplianceIcon = complianceStatus.icon

  return (
    <Card className="glass-panel border-gray-800 shadow-lg overflow-hidden">
      <CardHeader className="bg-black/40 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white">Trading Strategy</CardTitle>
          </div>
          <Link href={`/playbook/${strategy.id}`} passHref>
            <Button variant="outline" size="sm" className="glass-button text-white">
              View in Playbook
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Strategy Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">{strategy.name}</h3>
            <p className="text-gray-300 mt-1">{strategy.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-md bg-blue-900/40 border border-blue-700 text-blue-200 text-sm">
              {strategy.category}
            </div>
          </div>
        </div>

        {/* Strategy Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/40 rounded-md p-3 border border-gray-800">
            <p className="text-sm text-gray-400">Time Frame</p>
            <p className="text-white font-medium">{strategy.timeFrame || "Not specified"}</p>
          </div>
          <div className="bg-gray-900/40 rounded-md p-3 border border-gray-800">
            <p className="text-sm text-gray-400">Market Condition</p>
            <p className="text-white font-medium">{strategy.marketCondition || "Not specified"}</p>
          </div>
          <div className="bg-gray-900/40 rounded-md p-3 border border-gray-800">
            <p className="text-sm text-gray-400">Risk Level</p>
            <p className="text-white font-medium">{strategy.riskLevel || "Not specified"}</p>
          </div>
        </div>

        {/* Compliance Score */}
        <div className="bg-gray-900/40 rounded-md p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ComplianceIcon className={`h-5 w-5 ${complianceStatus.color}`} />
              <h4 className="text-lg font-medium text-white">Compliance Score</h4>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
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

          <Progress
            value={compliancePercentage}
            className="h-2 bg-gray-800"
            indicatorClassName={
              compliancePercentage >= 80 ? "bg-green-500" : compliancePercentage >= 50 ? "bg-yellow-500" : "bg-red-500"
            }
          />

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-md p-3 border border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-400">Critical Rules</p>
                <p
                  className={`text-sm font-medium ${criticalCompliancePercentage === 100 ? "" : ""}
                `}
                >
                  {criticalCompliancePercentage}% ({followedCriticalRules}/{criticalRules.length})
                </p>
              </div>
              <Progress
                value={criticalCompliancePercentage}
                className="h-2 bg-gray-800"
                indicatorClassName={
                  criticalCompliancePercentage >= 80
                    ? "bg-green-500"
                    : criticalCompliancePercentage >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }
              />
            </div>
          </div>

          {/* Collapsible Rules Section */}
          <Separator className="bg-gray-800" />
          <Collapsible open={isRulesOpen} onOpenChange={setIsRulesOpen}>
            <div className="flex items-center justify-between p-2">
              <h4 className="text-lg font-medium text-white">Trading Rules</h4>
              <CollapsibleTrigger className="focus:outline-none">
                {isRulesOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-gray-900/40 rounded-md p-3 border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white">{rule.description}</p>
                    {rule.isFollowed ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  {rule.note && (
                    <div className="text-sm text-gray-400 flex items-start gap-1">
                      <Info className="h-4 w-4 mt-0.5" />
                      <span>{rule.note}</span>
                    </div>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  )
}
