"use client"

import { useState, useEffect } from "react"
import { useStrategies } from "@/hooks/use-strategies"
import type { Strategy } from "@/types/playbook"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, Plus, Search, AlertTriangle, CheckCircle } from "lucide-react"
import { StrategyForm } from "@/components/playbook/strategy-form"
import { ComplianceScore } from "./compliance-score"

interface Rule {
  id: string
  description: string
  isCritical: boolean
  isFollowed: boolean
  note: string
}

interface TradeStrategyConnectionProps {
  tradeId?: string
  onStrategySelect?: (strategyId: string) => void
  onRulesUpdate?: (rules: Rule[]) => void
  selectedStrategyId?: string
  initialRules?: Rule[]
}

export function GlassTradeStrategyConnection({
  tradeId,
  onStrategySelect,
  onRulesUpdate,
  selectedStrategyId,
  initialRules = [],
}: TradeStrategyConnectionProps) {
  const { strategies, isLoading, error } = useStrategies()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [rules, setRules] = useState<Rule[]>(initialRules)
  const [isNewStrategyDialogOpen, setIsNewStrategyDialogOpen] = useState(false)

  // Filter strategies based on search term
  const filteredStrategies = strategies?.filter(
    (strategy) =>
      strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      strategy.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Find and set the selected strategy when selectedStrategyId changes
  useEffect(() => {
    if (selectedStrategyId && strategies) {
      const strategy = strategies.find((s) => s.id === selectedStrategyId)
      if (strategy) {
        setSelectedStrategy(strategy)

        // Initialize rules if they don't exist
        if (rules.length === 0 && strategy.rules) {
          const initializedRules = strategy.rules.map((rule) => ({
            id: rule.id,
            description: rule.description,
            isCritical: rule.isCritical || false,
            isFollowed: false,
            note: "",
          }))
          setRules(initializedRules)
          if (onRulesUpdate) onRulesUpdate(initializedRules)
        }
      }
    }
  }, [selectedStrategyId, strategies, rules.length, onRulesUpdate])

  // Handle strategy selection
  const handleStrategySelect = (strategy: Strategy) => {
    setSelectedStrategy(strategy)
    if (onStrategySelect) onStrategySelect(strategy.id)

    // Initialize rules
    if (strategy.rules) {
      const newRules = strategy.rules.map((rule) => ({
        id: rule.id,
        description: rule.description,
        isCritical: rule.isCritical || false,
        isFollowed: false,
        note: "",
      }))
      setRules(newRules)
      if (onRulesUpdate) onRulesUpdate(newRules)
    }
  }

  // Handle rule toggle
  const handleRuleToggle = (ruleId: string, isFollowed: boolean) => {
    const updatedRules = rules.map((rule) => (rule.id === ruleId ? { ...rule, isFollowed } : rule))
    setRules(updatedRules)
    if (onRulesUpdate) onRulesUpdate(updatedRules)
  }

  // Handle rule note update
  const handleRuleNoteUpdate = (ruleId: string, note: string) => {
    const updatedRules = rules.map((rule) => (rule.id === ruleId ? { ...rule, note } : rule))
    setRules(updatedRules)
    if (onRulesUpdate) onRulesUpdate(updatedRules)
  }

  // Calculate compliance score
  const followedRules = rules.filter((rule) => rule.isFollowed).length
  const totalRules = rules.length
  const compliancePercentage = totalRules > 0 ? (followedRules / totalRules) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Strategy Selector */}
      <div className="rounded-lg border border-gray-800 bg-black/30 backdrop-blur-xl backdrop-filter p-4 shadow-lg">
        <h3 className="text-lg font-medium text-white mb-4">Select Trading Strategy</h3>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search strategies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/20 border-gray-700 text-white placeholder-gray-400"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full bg-gray-800" />
            <Skeleton className="h-12 w-full bg-gray-800" />
            <Skeleton className="h-12 w-full bg-gray-800" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-md bg-red-900/30 border border-red-800 text-red-200 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load strategies. Please try again.</span>
          </div>
        ) : filteredStrategies && filteredStrategies.length > 0 ? (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredStrategies.map((strategy) => (
              <div
                key={strategy.id}
                onClick={() => handleStrategySelect(strategy)}
                className={`p-3 rounded-md cursor-pointer transition-all flex items-center justify-between ${
                  selectedStrategy?.id === strategy.id
                    ? "bg-blue-900/40 border border-blue-700"
                    : "bg-gray-900/40 border border-gray-800 hover:bg-gray-800/40"
                }`}
              >
                <div>
                  <h4 className="font-medium text-white">{strategy.name}</h4>
                  <p className="text-sm text-gray-400 line-clamp-1">{strategy.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-md bg-gray-900/40 border border-gray-800 text-gray-400 text-center">
            No strategies found. Try a different search term or create a new strategy.
          </div>
        )}

        <Dialog open={isNewStrategyDialogOpen} onOpenChange={setIsNewStrategyDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full mt-4 bg-blue-900/30 border-blue-700 hover:bg-blue-800/40 text-blue-200"
            >
              <Plus className="h-4 w-4 mr-2" /> Create New Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-gray-950/95 backdrop-blur-xl border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Create New Strategy</DialogTitle>
            </DialogHeader>
            <StrategyForm onSuccess={() => setIsNewStrategyDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Strategy Preview */}
      {selectedStrategy && (
        <div className="rounded-lg border border-gray-800 bg-black/30 backdrop-blur-xl backdrop-filter p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-white">Selected Strategy</h3>
            <div className="px-2 py-1 rounded-md bg-blue-900/40 border border-blue-700 text-blue-200 text-xs font-medium">
              {selectedStrategy.category}
            </div>
          </div>

          <h4 className="text-xl font-bold text-white mb-2">{selectedStrategy.name}</h4>
          <p className="text-gray-300 mb-4">{selectedStrategy.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-900/40 rounded-md p-3 border border-gray-800">
              <p className="text-sm text-gray-400">Time Frame</p>
              <p className="text-white font-medium">{selectedStrategy.timeFrame || "Not specified"}</p>
            </div>
            <div className="bg-gray-900/40 rounded-md p-3 border border-gray-800">
              <p className="text-sm text-gray-400">Market Condition</p>
              <p className="text-white font-medium">{selectedStrategy.marketCondition || "Not specified"}</p>
            </div>
          </div>

          <Separator className="my-4 bg-gray-800" />

          {/* Rule Checklist */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-white">Strategy Rules</h4>
              <ComplianceScore followedRules={followedRules} totalRules={totalRules} />
            </div>

            {rules.length > 0 ? (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="bg-gray-900/40 rounded-md p-3 border border-gray-800">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center cursor-pointer ${
                          rule.isFollowed ? "bg-green-600" : "bg-gray-700"
                        }`}
                        onClick={() => handleRuleToggle(rule.id, !rule.isFollowed)}
                      >
                        {rule.isFollowed && <CheckCircle className="h-5 w-5 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{rule.description}</p>
                          {rule.isCritical && (
                            <span className="px-2 py-0.5 rounded-full bg-red-900/40 border border-red-800 text-red-200 text-xs">
                              Critical
                            </span>
                          )}
                        </div>

                        <div className="mt-2">
                          <Label htmlFor={`note-${rule.id}`} className="text-xs text-gray-400 mb-1 block">
                            Note (optional)
                          </Label>
                          <Input
                            id={`note-${rule.id}`}
                            placeholder="Add note about this rule..."
                            value={rule.note}
                            onChange={(e) => handleRuleNoteUpdate(rule.id, e.target.value)}
                            className="h-8 text-sm bg-black/20 border-gray-700 text-white placeholder-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-md bg-gray-900/40 border border-gray-800 text-gray-400 text-center">
                No rules defined for this strategy.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
