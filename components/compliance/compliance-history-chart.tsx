"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"

interface ComplianceHistoryData {
  date: string
  complianceRate: number
  tradeCount: number
}

interface ComplianceHistoryChartProps {
  data?: ComplianceHistoryData[]
  loading?: boolean
}

export function ComplianceHistoryChart({ data = [], loading = false }: ComplianceHistoryChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance History</CardTitle>
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
          <CardTitle>Compliance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No compliance data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            config={{
              complianceRate: {
                label: "Compliance Rate (%)",
                color: "hsl(var(--chart-1))",
              },
              tradeCount: {
                label: "Trade Count",
                color: "hsl(var(--chart-2))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="complianceRate"
                  stroke="var(--color-complianceRate)"
                  activeDot={{ r: 8 }}
                  name="Compliance Rate (%)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tradeCount"
                  stroke="var(--color-tradeCount)"
                  name="Trade Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
