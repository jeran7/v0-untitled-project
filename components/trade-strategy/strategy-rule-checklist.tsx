"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Rule } from "@/types/database"
import type { ComplianceData } from "./trade-strategy-connection"

interface StrategyRuleChecklistProps {
  strategyId: string
  initialCompliance?: ComplianceData | null
  onComplianceChange: (compliance: ComplianceData) => void
  readOnly?: boolean
}

export function StrategyRuleChecklist({
  strategyId,
  initialCompliance,
  onComplianceChange,
  readOnly = false,
}: StrategyRuleChecklistProps) {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(false)
  const [compliance, setCompliance] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [generalNotes, setGeneralNotes] = useState("")
  const [complianceScore, setComplianceScore] = useState(0)
  const [followedRules, setFollowedRules] = useState(0)

  const { toast } = useToast()

  // Fetch rules for the selected strategy
  useEffect(() => {
    const fetchRules = async () => {
      if (!strategyId) {
        setRules([])
        return
      }

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("rules")
          .select("*")
          .eq("strategy_id", strategyId)
          .order("order_index")

        if (error) throw error
        setRules(data || [])

        // Initialize compliance state
        const initialComplianceState: Record<string, boolean> = {}
        const initialNotesState: Record<string, string> = {}

        data?.forEach((rule) => {
          // If we have initial compliance data, use it
          if (initialCompliance) {
            const ruleCompliance = initialCompliance.ruleCompliance.find((rc) => rc.ruleId === rule.id)
            if (ruleCompliance) {
              initialComplianceState[rule.id] = ruleCompliance.followed
              initialNotesState[rule.id] = ruleCompliance.notes || ""
            } else {
              initialComplianceState[rule.id] = false
              initialNotesState[rule.id] = ""
            }
          } else {
            initialComplianceState[rule.id] = false
            initialNotesState[rule.id] = ""
          }
        })

        setCompliance(initialComplianceState)
        setNotes(initialNotesState)
        setGeneralNotes(initialCompliance?.notes || "")
      } catch (error) {
        console.error("Error fetching rules:", error)
        toast({
          title: "Error",
          description: "Failed to load strategy rules. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRules()
  }, [strategyId, toast, initialCompliance])

  // Calculate compliance score and update parent component
  useEffect(() => {
    if (rules.length === 0) {
      setComplianceScore(0)
      setFollowedRules(0)
      return
    }

    // Count followed rules
    const followed = Object.values(compliance).filter(Boolean).length
    setFollowedRules(followed)
    const score = Math.round((followed / rules.length) * 100)
    setComplianceScore(score)

    // Create compliance data for parent component
    const complianceData: ComplianceData = {
      score,
      followedRules: followed,
      totalRules: rules.length,
      ruleCompliance: rules.map((rule) => ({
        ruleId: rule.id,
        followed: compliance[rule.id] || false,
        notes: notes[rule.id] || undefined,
      })),
      notes: generalNotes,
    }

    onComplianceChange(complianceData)
  }, [compliance, notes, generalNotes, rules, onComplianceChange])

  // Handle rule compliance change
  const handleComplianceChange = (ruleId: string, checked: boolean) => {
    if (readOnly) return

    setCompliance((prev) => ({
      ...prev,
      [ruleId]: checked,
    }))
  }

  // Handle rule notes change
  const handleNotesChange = (ruleId: string, value: string) => {
    if (readOnly) return

    setNotes((prev) => ({
      ...prev,
      [ruleId]: value,
    }))
  }

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

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg border-border/50">
        <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No rules found for this strategy</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Strategy Compliance</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {followedRules}/{rules.length} rules followed
            </span>
            <Progress value={complianceScore} className="w-24 h-2" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {readOnly ? "Rules followed in this trade" : "Check the rules you followed in this trade"}
        </p>
      </div>

      {Object.entries(groupedRules).map(([category, categoryRules]) => (
        <div key={category} className="space-y-3">
          <h4 className="font-medium text-sm">{formatCategoryName(category)}</h4>
          <div className="space-y-3">
            {categoryRules.map((rule) => (
              <div
                key={rule.id}
                className={`p-3 rounded-lg ${
                  readOnly
                    ? compliance[rule.id]
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-red-500/10 border-red-500/20"
                    : "bg-background/50 border border-border/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {readOnly ? (
                    compliance[rule.id] ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )
                  ) : (
                    <Checkbox
                      id={`rule-${rule.id}`}
                      checked={compliance[rule.id] || false}
                      onCheckedChange={(checked) => handleComplianceChange(rule.id, checked === true)}
                      className="mt-1"
                      disabled={readOnly}
                    />
                  )}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-start justify-between">
                      {!readOnly && (
                        <Label
                          htmlFor={`rule-${rule.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {rule.description}
                        </Label>
                      )}
                      {readOnly && <p className="text-sm font-medium">{rule.description}</p>}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`flex items-center gap-1 text-xs ${getPriorityColor(rule.priority)}`}>
                              {rule.priority === 1 ? <AlertCircle className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                              <span>{getPriorityLabel(rule.priority)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {rule.priority === 1
                                ? "Critical rule - must be followed"
                                : rule.priority === 2
                                  ? "Important rule - should be followed"
                                  : "Optional rule - good practice"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {!compliance[rule.id] && (
                      <Textarea
                        placeholder={readOnly ? "" : "Why didn't you follow this rule?"}
                        className="min-h-[60px] text-sm bg-background/50"
                        value={notes[rule.id] || ""}
                        onChange={(e) => handleNotesChange(rule.id, e.target.value)}
                        disabled={readOnly}
                      />
                    )}
                    {readOnly && !compliance[rule.id] && notes[rule.id] && (
                      <div className="mt-2 p-2 rounded bg-background/50 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Why rule wasn't followed:</p>
                        <p>{notes[rule.id]}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="compliance-notes" className="text-sm font-medium">
          General Compliance Notes
        </Label>
        <Textarea
          id="compliance-notes"
          placeholder={readOnly ? "" : "Add any general notes about your strategy compliance..."}
          className="min-h-[100px] bg-background/50"
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          disabled={readOnly}
        />
      </div>

      <div className="p-4 rounded-lg bg-background/30 backdrop-blur-md border border-border/50">
        <div className="flex items-center gap-2">
          {complianceScore >= 80 ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
          <div>
            <p className="font-medium">
              {complianceScore >= 80
                ? "Good strategy compliance"
                : complianceScore >= 50
                  ? "Moderate strategy compliance"
                  : "Poor strategy compliance"}
            </p>
            <p className="text-sm text-muted-foreground">
              {complianceScore >= 80
                ? "You followed most of the strategy rules."
                : complianceScore >= 50
                  ? "You followed some of the strategy rules."
                  : "You followed few of the strategy rules."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
