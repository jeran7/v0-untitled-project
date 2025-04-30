import type { Strategy } from "@/types/playbook"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BookOpen } from "lucide-react"

interface TradeStrategyBadgeProps {
  strategy: Strategy
  complianceScore?: number
  size?: "sm" | "md" | "lg"
}

export function GlassTradeStrategyBadge({ strategy, complianceScore, size = "md" }: TradeStrategyBadgeProps) {
  // Determine badge styling based on compliance score
  const getBadgeStyle = () => {
    if (complianceScore === undefined) return "bg-blue-900/40 border-blue-700 text-blue-200"

    if (complianceScore >= 80) return "bg-green-900/40 border-green-700 text-green-200 glow-green"
    if (complianceScore >= 50) return "bg-yellow-900/40 border-yellow-700 text-yellow-200"
    return "bg-red-900/40 border-red-700 text-red-200 glow-red"
  }

  // Determine size classes
  const sizeClasses = {
    sm: "text-xs py-0.5 px-2",
    md: "text-sm py-1 px-2.5",
    lg: "text-base py-1.5 px-3",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`
              backdrop-blur-md border font-medium flex items-center gap-1.5 
              ${getBadgeStyle()} ${sizeClasses[size]}
            `}
          >
            <BookOpen className={size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"} />
            {strategy.name}
            {complianceScore !== undefined && (
              <span
                className={`
                ml-1 rounded-full 
                ${size === "sm" ? "text-[10px] px-1" : size === "md" ? "text-xs px-1.5" : "text-sm px-2"} 
                bg-black/30 border border-gray-700
              `}
              >
                {complianceScore}%
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="glass-panel border-gray-800 text-white">
          <div className="space-y-2 p-1">
            <p className="font-medium">{strategy.name}</p>
            <p className="text-xs text-gray-300">{strategy.description}</p>
            {complianceScore !== undefined && (
              <p className="text-xs">
                Compliance Score:{" "}
                <span
                  className={`font-medium ${
                    complianceScore >= 80
                      ? "text-green-400"
                      : complianceScore >= 50
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {complianceScore}%
                </span>
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
