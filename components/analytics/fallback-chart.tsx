"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LineData {
  time: string | number
  value: number
}

interface FallbackChartProps {
  data: LineData[]
  title: string
  description?: string
  height?: number
  isLoading?: boolean
  className?: string
}

export function FallbackChart({
  data,
  title,
  description,
  height = 400,
  isLoading = false,
  className,
}: FallbackChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data.length) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.clientWidth * window.devicePixelRatio
    canvas.height = canvas.clientHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Find min and max values
    const values = data.map((d) => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const valueRange = maxValue - minValue

    // Calculate padding
    const padding = { top: 20, right: 20, bottom: 30, left: 40 }
    const chartWidth = canvas.clientWidth - padding.left - padding.right
    const chartHeight = canvas.clientHeight - padding.top - padding.bottom

    // Draw axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, canvas.clientHeight - padding.bottom)
    ctx.lineTo(canvas.clientWidth - padding.right, canvas.clientHeight - padding.bottom)
    ctx.stroke()

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.beginPath()
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i) / 5
      ctx.moveTo(padding.left, y)
      ctx.lineTo(canvas.clientWidth - padding.right, y)
    }
    ctx.stroke()

    // Draw line
    if (data.length > 1) {
      ctx.strokeStyle = "rgba(76, 175, 80, 1)"
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((point, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth
        const normalizedValue = valueRange === 0 ? 0.5 : (point.value - minValue) / valueRange
        const y = canvas.clientHeight - padding.bottom - normalizedValue * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // Fill area under the line
      ctx.lineTo(padding.left + chartWidth, canvas.clientHeight - padding.bottom)
      ctx.lineTo(padding.left, canvas.clientHeight - padding.bottom)
      ctx.closePath()
      ctx.fillStyle = "rgba(76, 175, 80, 0.1)"
      ctx.fill()
    }

    // Draw labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ctx.font = "10px Inter, sans-serif"
    ctx.textAlign = "right"

    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange * i) / 5
      const y = canvas.clientHeight - padding.bottom - (chartHeight * i) / 5
      ctx.fillText(value.toFixed(2), padding.left - 5, y + 3)
    }

    // X-axis labels (show first, middle, and last date)
    if (data.length > 0) {
      ctx.textAlign = "center"

      // First date
      const firstDate = typeof data[0].time === "string" ? data[0].time : new Date(data[0].time).toLocaleDateString()
      ctx.fillText(firstDate, padding.left, canvas.clientHeight - padding.bottom + 15)

      // Middle date
      const middleIndex = Math.floor(data.length / 2)
      const middleDate =
        typeof data[middleIndex].time === "string"
          ? data[middleIndex].time
          : new Date(data[middleIndex].time).toLocaleDateString()
      ctx.fillText(middleDate, padding.left + chartWidth / 2, canvas.clientHeight - padding.bottom + 15)

      // Last date
      const lastDate =
        typeof data[data.length - 1].time === "string"
          ? data[data.length - 1].time
          : new Date(data[data.length - 1].time).toLocaleDateString()
      ctx.fillText(lastDate, padding.left + chartWidth, canvas.clientHeight - padding.bottom + 15)
    }
  }, [data])

  return (
    <Card className={cn("glass-card overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data.length ? (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <div className="w-full" style={{ height: `${height}px` }}>
            <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
