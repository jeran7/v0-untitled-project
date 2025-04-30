"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"

interface StrategyComplianceData {
  strategyName: string
  compliantPnL: number
  nonCompliantPnL: number
  compliantWinRate: number
  nonCompliantWinRate: number
}

interface StrategyPerformanceByComplianceProps {
  data?: StrategyComplianceData[]
  loading?: boolean
}

export function StrategyPerformanceByCompliance({ data = [], loading = false }: StrategyPerformanceByComplianceProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategy Performance by Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategy Performance by Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No strategy performance data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Performance by Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            config={{
              compliantPnL: {
                label: "Compliant P&L ($)",
                color: "hsl(var(--chart-1))",
              },
              nonCompliantPnL: {
                label: "Non-Compliant P&L ($)",
                color: "hsl(var(--chart-2))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="strategyName" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="compliantPnL" fill="var(--color-compliantPnL)" name="Compliant P&L ($)" />
                <Bar dataKey="nonCompliantPnL" fill="var(--color-nonCompliantPnL)" name="Non-Compliant P&L ($)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
