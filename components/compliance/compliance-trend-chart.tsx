"use client"

import { LineChart, Line, ResponsiveContainer } from "recharts"

interface ComplianceTrendChartProps {
  data: {
    date: string
    compliance: number
    trades: number
  }[]
}

export function ComplianceTrendChart({ data }: ComplianceTrendChartProps) {
  // Reverse the data to show most recent on the right
  const chartData = [...data].reverse().map((item) => ({
    date: item.date,
    value: item.compliance * 100,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
