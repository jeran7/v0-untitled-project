"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"

interface RuleImpactData {
  rule: string
  profitImpact: number
  frequency: number
}

interface RuleImpactChartProps {
  data?: RuleImpactData[]
  loading?: boolean
}

export function RuleImpactChart({ data = [], loading = false }: RuleImpactChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rule Impact Analysis</CardTitle>
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
          <CardTitle>Rule Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No rule impact data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort by profit impact (most negative first)
  const sortedData = [...data].sort((a, b) => a.profitImpact - b.profitImpact).slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rule Impact Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            config={{
              profitImpact: {
                label: "Profit Impact ($)",
                color: "hsl(var(--chart-1))",
              },
              frequency: {
                label: "Frequency",
                color: "hsl(var(--chart-2))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rule" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar yAxisId="left" dataKey="profitImpact" fill="var(--color-profitImpact)" name="Profit Impact ($)" />
                <Bar yAxisId="right" dataKey="frequency" fill="var(--color-frequency)" name="Frequency" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
