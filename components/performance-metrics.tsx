"use client"

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const winLossData = [
  { name: "Wins", value: 85, color: "hsl(var(--profit))" },
  { name: "Losses", value: 39, color: "hsl(var(--loss))" },
]

const profitByDayData = [
  { name: "Mon", profit: 1250 },
  { name: "Tue", profit: 1850 },
  { name: "Wed", profit: -450 },
  { name: "Thu", profit: 2100 },
  { name: "Fri", profit: 950 },
]

export function PerformanceMetrics() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Win/Loss Ratio</CardTitle>
          <CardDescription>Distribution of winning and losing trades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [value, "Trades"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Profit by Day</CardTitle>
          <CardDescription>Performance breakdown by day of week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitByDayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--muted))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--muted))" }}
                  tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(1) + "k" : value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Profit"]}
                />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {profitByDayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceMetrics
