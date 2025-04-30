import type { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ComplianceOverview } from "@/components/compliance/compliance-overview"
import { ComplianceByStrategy } from "@/components/compliance/compliance-by-strategy"
import { BrokenRulesAnalysis } from "@/components/compliance/broken-rules-analysis"
import { ComplianceHistoryChart } from "@/components/compliance/compliance-history-chart"
import { RuleImpactChart } from "@/components/compliance/rule-impact-chart"
import { ComplianceHeatmap } from "@/components/compliance/compliance-heatmap"
import { StrategyPerformanceByCompliance } from "@/components/compliance/strategy-performance-by-compliance"

export const metadata: Metadata = {
  title: "Strategy Compliance Analysis | TradePro",
  description: "Analyze how well you follow your trading strategies and how it impacts your results",
}

export default function CompliancePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Strategy Compliance Analysis</h1>
        <p className="text-muted-foreground">
          Analyze how well you follow your trading strategies and how it impacts your results
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ComplianceOverview />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-strategy">By Strategy</TabsTrigger>
          <TabsTrigger value="rule-analysis">Rule Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance Impact</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="col-span-1 overflow-hidden backdrop-blur-sm bg-black/30 border-slate-800">
              <CardHeader>
                <CardTitle>Compliance History</CardTitle>
                <CardDescription>Your strategy compliance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ComplianceHistoryChart />
              </CardContent>
            </Card>
            <Card className="col-span-1 overflow-hidden backdrop-blur-sm bg-black/30 border-slate-800">
              <CardHeader>
                <CardTitle>Compliance Heatmap</CardTitle>
                <CardDescription>Visualize your compliance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ComplianceHeatmap />
              </CardContent>
            </Card>
          </div>
          <Card className="overflow-hidden backdrop-blur-sm bg-black/30 border-slate-800">
            <CardHeader>
              <CardTitle>Broken Rules Analysis</CardTitle>
              <CardDescription>Most frequently broken rules across all strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <BrokenRulesAnalysis />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="by-strategy" className="space-y-6 pt-4">
          <Card className="overflow-hidden backdrop-blur-sm bg-black/30 border-slate-800">
            <CardHeader>
              <CardTitle>Compliance by Strategy</CardTitle>
              <CardDescription>How well you follow each strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceByStrategy />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rule-analysis" className="space-y-6 pt-4">
          <Card className="overflow-hidden backdrop-blur-sm bg-black/30 border-slate-800">
            <CardHeader>
              <CardTitle>Rule Impact Analysis</CardTitle>
              <CardDescription>Which rules have the biggest impact on your results</CardDescription>
            </CardHeader>
            <CardContent>
              <RuleImpactChart />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance" className="space-y-6 pt-4">
          <Card className="overflow-hidden backdrop-blur-sm bg-black/30 border-slate-800">
            <CardHeader>
              <CardTitle>Performance by Compliance Level</CardTitle>
              <CardDescription>How compliance affects your trading results</CardDescription>
            </CardHeader>
            <CardContent>
              <StrategyPerformanceByCompliance />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
