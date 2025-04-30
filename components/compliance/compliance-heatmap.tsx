"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Tooltip, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid } from "recharts"

interface ComplianceHeatmapData {
  strategyId: string
  strategyName: string
  complianceRate: number
  profitFactor: number
  tradeCount: number
}

interface ComplianceHeatmapProps {
  data?: ComplianceHeatmapData[]
  loading?: boolean
}

export function ComplianceHeatmap({ data = [], loading = false }: ComplianceHeatmapProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance vs Performance Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading heatmap...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance vs Performance Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No compliance data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transform data for the scatter chart
  const chartData = data.map((item) => ({
    x: item.complianceRate,
    y: item.profitFactor,
    z: item.tradeCount,
    name: item.strategyName,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance vs Performance Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="Compliance Rate" unit="%" domain={[0, 100]} />
                <YAxis type="number" dataKey="y" name="Profit Factor" domain={[0, "dataMax + 0.5"]} />
                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Trade Count" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name, props) => {
                    if (name === "x") return [`${value}%`, "Compliance Rate"]
                    if (name === "y") return [value.toFixed(2), "Profit Factor"]
                    if (name === "z") return [value, "Trade Count"]
                    return [value, name]
                  }}
                  labelFormatter={(value) => chartData[value]?.name || ""}
                />
                <Scatter name="Strategies" data={chartData} fill="hsl(var(--primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
