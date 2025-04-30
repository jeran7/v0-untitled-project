import type { Metadata } from "next"
import { StrategyComplianceDashboard } from "@/components/compliance/strategy-compliance-dashboard"

export const metadata: Metadata = {
  title: "Strategy Compliance Dashboard | TradePro",
  description: "Analyze how well you follow your trading strategies and identify areas for improvement",
}

export default function ComplianceDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Strategy Compliance Dashboard</h1>
        <p className="text-muted-foreground">
          Analyze how well you follow your trading strategies and identify areas for improvement
        </p>
      </div>

      <StrategyComplianceDashboard />
    </div>
  )
}
