"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// Mock price data
const generatePriceData = () => {
  const basePrice = 152
  const data = []

  for (let i = 0; i < 390; i++) {
    const time = new Date(2023, 2, 1, 9, 30)
    time.setMinutes(time.getMinutes() + i)

    let price
    if (i < 60) {
      // First hour - slight uptrend
      price = basePrice + Math.random() * 0.5 + i * 0.01
    } else if (i < 120) {
      // Second hour - consolidation
      price = basePrice + 1 + Math.random() * 0.8 - 0.4
    } else if (i < 180) {
      // Third hour - breakout
      price = basePrice + 1 + (i - 120) * 0.05 + Math.random() * 0.3
    } else {
      // Rest of day - continued uptrend with pullback
      price = basePrice + 4 + (i - 180) * 0.01 + Math.random() * 0.8 - 0.4
    }

    const volume = Math.floor(Math.random() * 10000) + 5000

    data.push({
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      price: Number.parseFloat(price.toFixed(2)),
      volume,
    })
  }

  return data
}

const priceData = generatePriceData()

// Trade execution points
const entryPoint = {
  time: "10:32",
  price: 152.45,
}

const exitPoint = {
  time: "14:15",
  price: 156.78,
}

const stopLossPoint = {
  price: 150.2,
}

const takeProfitPoint = {
  price: 158.5,
}

interface TradeChartProps {
  fullscreen?: boolean
}

export default function TradeChart({ fullscreen = false }: TradeChartProps) {
  const [timeframe, setTimeframe] = useState("1m")
  const [chartType, setChartType] = useState("area")
  const [showVolume, setShowVolume] = useState(true)
  const [showIndicators, setShowIndicators] = useState(["volume", "levels"])

  const chartHeight = fullscreen ? 600 : 400

  const handleIndicatorToggle = (value: string[]) => {
    setShowIndicators(value)
    setShowVolume(value.includes("volume"))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs defaultValue="1m" className="w-auto">
          <TabsList className="bg-secondary/30">
            <TabsTrigger value="1m" onClick={() => setTimeframe("1m")}>
              1m
            </TabsTrigger>
            <TabsTrigger value="5m" onClick={() => setTimeframe("5m")}>
              5m
            </TabsTrigger>
            <TabsTrigger value="15m" onClick={() => setTimeframe("15m")}>
              15m
            </TabsTrigger>
            <TabsTrigger value="1h" onClick={() => setTimeframe("1h")}>
              1h
            </TabsTrigger>
            <TabsTrigger value="1d" onClick={() => setTimeframe("1d")}>
              1D
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Tabs defaultValue="area" className="w-auto">
            <TabsList className="bg-secondary/30">
              <TabsTrigger value="line" onClick={() => setChartType("line")}>
                Line
              </TabsTrigger>
              <TabsTrigger value="candle" onClick={() => setChartType("candle")}>
                Candle
              </TabsTrigger>
              <TabsTrigger value="area" onClick={() => setChartType("area")}>
                Area
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <ToggleGroup type="multiple" value={showIndicators} onValueChange={handleIndicatorToggle}>
            <ToggleGroupItem value="volume" aria-label="Toggle volume">
              Volume
            </ToggleGroupItem>
            <ToggleGroupItem value="levels" aria-label="Toggle levels">
              Levels
            </ToggleGroupItem>
            <ToggleGroupItem value="ma" aria-label="Toggle moving averages">
              MA
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className={`h-[${chartHeight}px]`} style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--profit))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--profit))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
            <XAxis
              dataKey="time"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--muted))" }}
              interval={Math.floor(priceData.length / 10)}
            />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--muted))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Area type="monotone" dataKey="price" stroke="hsl(var(--profit))" fillOpacity={1} fill="url(#colorPrice)" />

            {/* Entry point */}
            <ReferenceLine
              x={entryPoint.time}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: "Entry",
                position: "insideTopRight",
                fill: "hsl(var(--primary))",
              }}
            />

            {/* Exit point */}
            <ReferenceLine
              x={exitPoint.time}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: "Exit",
                position: "insideTopRight",
                fill: "hsl(var(--primary))",
              }}
            />

            {showIndicators.includes("levels") && (
              <>
                {/* Stop loss */}
                <ReferenceLine
                  y={stopLossPoint.price}
                  stroke="hsl(var(--loss))"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{
                    value: "Stop Loss",
                    position: "insideRight",
                    fill: "hsl(var(--loss))",
                  }}
                />

                {/* Take profit */}
                <ReferenceLine
                  y={takeProfitPoint.price}
                  stroke="hsl(var(--profit))"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{
                    value: "Take Profit",
                    position: "insideRight",
                    fill: "hsl(var(--profit))",
                  }}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {showVolume && (
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
              <XAxis
                dataKey="time"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--muted))" }}
                interval={Math.floor(priceData.length / 10)}
              />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--muted))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.3}
              />

              {/* Entry point */}
              <ReferenceLine x={entryPoint.time} stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="3 3" />

              {/* Exit point */}
              <ReferenceLine x={exitPoint.time} stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
