"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { date: "Jan 1", balance: 10000 },
  { date: "Jan 5", balance: 10250 },
  { date: "Jan 10", balance: 10180 },
  { date: "Jan 15", balance: 10400 },
  { date: "Jan 20", balance: 10320 },
  { date: "Jan 25", balance: 10800 },
  { date: "Jan 30", balance: 11200 },
  { date: "Feb 5", balance: 11150 },
  { date: "Feb 10", balance: 11500 },
  { date: "Feb 15", balance: 11800 },
  { date: "Feb 20", balance: 11750 },
  { date: "Feb 25", balance: 12100 },
  { date: "Mar 1", balance: 12458 },
]

export function EquityCurveChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--profit))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--profit))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--muted))" }}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--muted))" }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, "Balance"]}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="hsl(var(--profit))"
            fillOpacity={1}
            fill="url(#colorBalance)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default EquityCurveChart
