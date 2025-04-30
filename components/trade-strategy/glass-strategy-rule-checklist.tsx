"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Check, Info } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface Rule {
  id: string
  description: string
  isCritical: boolean
}

interface Strategy {
  id: string
  name: string
  rules: Rule[]
}

interface RuleComplianceItem {
  ruleId: string
  followed: boolean
  notes: string
}

interface StrategyRuleChecklistProps {
  strategyId?: string
  strategies?: Strategy[]
  value?: RuleComplianceItem[]
  onChange?: (value: RuleComplianceItem[]) => void
  isLoading?: boolean
  readOnly?: boolean
}

export function GlassStrategyRuleChecklist({
  strategyId,
  strategies,
  value = [],
  onChange,
  isLoading = false,
  readOnly = false,
}: StrategyRuleChecklistProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [compliance, setCompliance] = useState<RuleComplianceItem[]>(value)

  useEffect(() => {
    if (strategyId && strategies) {
      const strategy = strategies.find((s) => s.id === strategyId)
      setSelectedStrategy(strategy || null)

      // Initialize compliance items for any new rules
      if (strategy) {
        const updatedCompliance = [...compliance]

        strategy.rules.forEach((rule) => {
          const existingRule = compliance.find((c) => c.ruleId === rule.id)
          if (!existingRule) {
            updatedCompliance.push({
              ruleId: rule.id,
              followed: false,
              notes: "",
            })
          }
        })

        setCompliance(updatedCompliance)
        if (onChange) onChange(updatedCompliance)
      }
    } else {
      setSelectedStrategy(null)
    }
  }, [strategyId, strategies])

  // Update local state when value prop changes
  useEffect(() => {
    setCompliance(value)
  }, [value])

  const handleComplianceChange = (ruleId: string, followed: boolean) => {
    if (readOnly) return

    const updatedCompliance = compliance.map((item) => (item.ruleId === ruleId ? { ...item, followed } : item))

    setCompliance(updatedCompliance)
    if (onChange) onChange(updatedCompliance)
  }

  const handleNotesChange = (ruleId: string, notes: string) => {
    if (readOnly) return

    const updatedCompliance = compliance.map((item) => (item.ruleId === ruleId ? { ...item, notes } : item))

    setCompliance(updatedCompliance)
    if (onChange) onChange(updatedCompliance)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!selectedStrategy || !selectedStrategy.rules || selectedStrategy.rules.length === 0) {
    return (
      <div className="glass-card p-4 rounded-lg text-center">
        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
          <Info size={24} className="mb-2 text-gray-500" />
          <p className="text-sm">
            {!strategyId ? "Select a strategy to see rules" : "This strategy doesn't have any rules defined"}
          </p>
        </div>
      </div>
    )
  }

  const followedRules = compliance.filter((c) => c.followed).length
  const totalRules = selectedStrategy.rules.length
  const compliancePercentage = Math.round((followedRules / totalRules) * 100)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-200">Strategy Rules</h3>
        <div className="flex items-center">
          <span className="text-sm text-gray-300 mr-2">
            {followedRules}/{totalRules} followed
          </span>
          <Badge
            className={cn(
              "glass-badge",
              compliancePercentage >= 80
                ? "bg-emerald-950/30 text-emerald-400"
                : compliancePercentage >= 50
                  ? "bg-amber-950/30 text-amber-400"
                  : "bg-red-950/30 text-red-400",
            )}
          >
            {compliancePercentage}%
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {selectedStrategy.rules.map((rule) => {
          const complianceItem = compliance.find((c) => c.ruleId === rule.id)
          const isFollowed = complianceItem?.followed || false
          const notes = complianceItem?.notes || ""

          return (
            <div
              key={rule.id}
              className={cn(
                "glass-card p-4 rounded-lg transition-all duration-200",
                isFollowed ? "border-l-4 border-emerald-500" : "border-l-4 border-gray-700",
                rule.isCritical && !isFollowed && "border-l-4 border-red-500",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <Checkbox
                    id={`rule-${rule.id}`}
                    checked={isFollowed}
                    onCheckedChange={(checked) => handleComplianceChange(rule.id, checked === true)}
                    disabled={readOnly}
                    className={cn("glass-checkbox", isFollowed && "bg-emerald-500 text-emerald-950")}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <label
                      htmlFor={`rule-${rule.id}`}
                      className={cn(
                        "text-sm font-medium cursor-pointer",
                        isFollowed ? "text-emerald-300" : "text-gray-200",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {rule.description}
                        {rule.isCritical && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <AlertTriangle
                                    size={14}
                                    className={cn("text-red-400", isFollowed && "text-gray-500")}
                                  />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="glass-tooltip">
                                <p className="text-xs">Critical rule</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </label>
                    {isFollowed && <Check size={16} className="text-emerald-400" />}
                  </div>

                  <Textarea
                    placeholder={isFollowed ? "Add notes (optional)" : "Explain why this rule wasn't followed..."}
                    value={notes}
                    onChange={(e) => handleNotesChange(rule.id, e.target.value)}
                    className={cn(
                      "glass-input min-h-[60px] text-sm resize-none",
                      !isFollowed && rule.isCritical && "border-red-800 focus:border-red-700",
                    )}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
