import type { Metadata } from "next"
import { PerformanceByComplianceAnalysis } from "@/components/compliance/performance-by-compliance-analysis"

export const metadata: Metadata = {
  title: "Performance by Compliance Analysis | TradePro",
  description: "Analyze how strategy compliance affects your trading performance",
}

export default function PerformanceByCompliancePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Performance by Compliance Analysis</h1>
        <p className="text-muted-foreground">
          Understand how following your trading strategies affects your results and identify which rules matter most
        </p>
      </div>

      <PerformanceByComplianceAnalysis />
    </div>
  )
}
