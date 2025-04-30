import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Strategy } from "@/hooks/use-strategies"
import { BarChart2, CheckCircle2, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"

interface StrategyCardProps {
  strategy: Strategy
}

export function StrategyCard({ strategy }: StrategyCardProps) {
  // Calculate metrics
  const winRate = strategy.win_rate || 0
  const profitFactor = strategy.profit_factor || 0
  const avgR = strategy.avg_r_multiple || 0
  const tradesCount = strategy.usage_count || 0

  // Determine badge color based on category
  const getBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case "breakout":
        return "default"
      case "reversal":
        return "destructive"
      case "trend":
        return "success"
      case "range":
        return "warning"
      case "momentum":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Link href={`/playbook/${strategy.id}`} className="block">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-background/80 backdrop-blur-[20px] border-primary/10 hover:border-primary/30">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold leading-none tracking-tight">{strategy.name}</h3>
              <Badge variant={getBadgeVariant(strategy.category)} className="mt-2">
                {strategy.category}
              </Badge>
            </div>
            {strategy.setup_image && (
              <div className="w-12 h-12 rounded-md overflow-hidden">
                <img
                  src={strategy.setup_image || "/placeholder.svg"}
                  alt={`${strategy.name} setup`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {strategy.description || "No description provided."}
          </p>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2 pt-2">
          <div className="flex items-center gap-1 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span className="text-muted-foreground">Win Rate:</span>
            <span className="font-medium">{winRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-muted-foreground">Profit Factor:</span>
            <span className="font-medium">{profitFactor.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <BarChart2 className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-muted-foreground">Avg R:</span>
            <span className="font-medium">{avgR.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-muted-foreground">Trades:</span>
            <span className="font-medium">{tradesCount}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
