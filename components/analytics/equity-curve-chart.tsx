"use client"

import { useState } from "react"
import { TradingViewChart } from "@/components/charts/trading-view-chart"
import { FallbackChart } from "@/components/analytics/fallback-chart"
import type { LineData } from "lightweight-charts"

interface EquityCurveChartProps {
  data?: LineData[]
  isLoading?: boolean
}

export function EquityCurveChart({ data = [], isLoading = false }: EquityCurveChartProps) {
  const [useFallback, setUseFallback] = useState(false)

  // Handle TradingView chart error
  const handleChartError = () => {
    setUseFallback(true)
  }

  if (useFallback) {
    return (
      <FallbackChart
        data={data}
        title="Equity Curve"
        description="Account balance over time"
        height={400}
        isLoading={isLoading}
      />
    )
  }

  return (
    <TradingViewChart
      data={data}
      title="Equity Curve"
      description="Account balance over time"
      height={400}
      isLoading={isLoading}
      onError={handleChartError}
    />
  )
}
