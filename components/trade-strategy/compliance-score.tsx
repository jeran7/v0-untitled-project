"use client"

import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ComplianceScoreProps {
  score: number
  followedRules: number
  totalRules: number
  className?: string
}

export function ComplianceScore({ score, followedRules, totalRules, className }: ComplianceScoreProps) {
  // Determine color and icon based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 50) return "text-amber-500"
    return "text-red-500"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />
    if (score >= 50) return <AlertTriangle className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  const getScoreBackground = (score: number) => {
    if (score >= 80) return "bg-green-500/10"
    if (score >= 50) return "bg-amber-500/10"
    return "bg-red-500/10"
  }

  const getScoreBorder = (score: number) => {
    if (score >= 80) return "border-green-500/20"
    if (score >= 50) return "border-amber-500/20"
    return "border-red-500/20"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border",
              getScoreBackground(score),
              getScoreBorder(score),
              className,
            )}
          >
            <span className={cn("flex items-center gap-1", getScoreColor(score))}>
              {getScoreIcon(score)}
              <span className="font-medium">{score}%</span>
            </span>
            <Progress
              value={score}
              className="w-16 h-1.5"
              indicatorClassName={cn(score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500")}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Compliance Score: {score}%</p>
            <p className="text-muted-foreground">
              {followedRules} of {totalRules} rules followed
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
