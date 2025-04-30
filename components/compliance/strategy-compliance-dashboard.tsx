"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateRangeSelector } from "@/components/analytics/date-range-selector"
import { ComplianceOverviewCards } from "@/components/compliance/compliance-overview-cards"
import { StrategyComplianceTable } from "@/components/compliance/strategy-compliance-table"
import { RuleComplianceBreakdown } from "@/components/compliance/rule-compliance-breakdown"
import { ComplianceCalendarView } from "@/components/compliance/compliance-calendar-view"
import { useComplianceData } from "@/hooks/use-compliance-data"

export function StrategyComplianceDashboard() {
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    to: new Date(),
  })

  const { data, loading, error } = useComplianceData(dateRange)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Compliance Analysis</h2>
          <p className="text-muted-foreground">Track how well you follow your trading strategies</p>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      <ComplianceOverviewCards data={data} isLoading={loading} />

      <Tabs defaultValue="strategies" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="strategies">Strategy Compliance</TabsTrigger>
          <TabsTrigger value="rules">Rule Breakdown</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-6">
          <StrategyComplianceTable data={data} isLoading={loading} />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <RuleComplianceBreakdown data={data} isLoading={loading} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <ComplianceCalendarView data={data} isLoading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
