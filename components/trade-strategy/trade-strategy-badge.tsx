"use client"

import { Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ComplianceScore } from "@/components/trade-strategy/compliance-score"
import { cn } from "@/lib/utils"

interface TradeStrategyBadgeProps {
  strategyName: string
  strategyCategory?: string
  complianceScore?: number
  followedRules?: number
  totalRules?: number
  className?: string
}

export function TradeStrategyBadge({
  strategyName,
  strategyCategory,
  complianceScore,
  followedRules,
  totalRules,
  className,
}: TradeStrategyBadgeProps) {
  // Get category badge color
  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-gray-500/20 text-gray-500"

    const colors: Record<string, string> = {
      breakout: "bg-blue-500/20 text-blue-500",
      reversal: "bg-red-500/20 text-red-500",
      trend_following: "bg-green-500/20 text-green-500",
      pullback: "bg-amber-500/20 text-amber-500",
      support_resistance: "bg-purple-500/20 text-purple-500",
      momentum: "bg-cyan-500/20 text-cyan-500",
      volatility: "bg-orange-500/20 text-orange-500",
      gap: "bg-indigo-500/20 text-indigo-500",
      pattern: "bg-rose-500/20 text-rose-500",
    }
    return colors[category] || "bg-gray-500/20 text-gray-500"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", className)}>
            <Badge variant="outline" className={cn("flex items-center gap-1", getCategoryColor(strategyCategory))}>
              <Tag className="h-3 w-3" />
              {strategyName}
            </Badge>

            {complianceScore !== undefined && followedRules !== undefined && totalRules !== undefined && (
              <ComplianceScore score={complianceScore} followedRules={followedRules} totalRules={totalRules} />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Strategy: {strategyName}</p>
            {strategyCategory && <p className="text-muted-foreground">Category: {strategyCategory}</p>}
            {complianceScore !== undefined && <p className="text-muted-foreground">Compliance: {complianceScore}%</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
