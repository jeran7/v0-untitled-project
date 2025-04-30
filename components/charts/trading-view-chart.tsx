"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Maximize2, Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Define the LineData interface
interface LineData {
  time: string | number
  value: number
}

interface ChartProps {
  data: LineData[]
  volumeData?: LineData[]
  title: string
  description?: string
  height?: number
  onTimeRangeChange?: (from: any, to: any) => void
  isLoading?: boolean
  className?: string
  showFullScreenButton?: boolean
  showDownloadButton?: boolean
  timeScaleVisible?: boolean
  tooltipVisible?: boolean
  crosshairVisible?: boolean
  priceScaleVisible?: boolean
  gridVisible?: boolean
  borderVisible?: boolean
  watermarkText?: string
  onError?: () => void
}

export function TradingViewChart({
  data,
  volumeData,
  title,
  description,
  height = 400,
  onTimeRangeChange,
  isLoading = false,
  className,
  showFullScreenButton = true,
  showDownloadButton = true,
  timeScaleVisible = true,
  tooltipVisible = true,
  crosshairVisible = true,
  priceScaleVisible = true,
  gridVisible = true,
  borderVisible = true,
  watermarkText,
  onError,
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chart, setChart] = useState<any | null>(null)
  const [lineSeries, setLineSeries] = useState<any | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)

  // Create chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Dynamic import of lightweight-charts to ensure it only runs on client
    const initChart = async () => {
      try {
        // Import the library
        const { createChart } = await import("lightweight-charts")

        if (!chartContainerRef.current) return

        // Create chart options
        const chartOptions = {
          layout: {
            background: { type: "solid", color: "transparent" },
            textColor: "rgba(255, 255, 255, 0.9)",
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
          },
          width: chartContainerRef.current.clientWidth,
          height: isFullScreen ? window.innerHeight - 100 : height,
          timeScale: {
            visible: timeScaleVisible,
            borderColor: "rgba(197, 203, 206, 0.3)",
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            visible: priceScaleVisible,
            borderColor: "rgba(197, 203, 206, 0.3)",
          },
          crosshair: {
            visible: crosshairVisible,
            horzLine: {
              visible: true,
              labelVisible: true,
            },
            vertLine: {
              visible: true,
              labelVisible: true,
            },
          },
          grid: {
            vertLines: {
              visible: gridVisible,
              color: "rgba(42, 46, 57, 0.6)",
            },
            horzLines: {
              visible: gridVisible,
              color: "rgba(42, 46, 57, 0.6)",
            },
          },
          handleScroll: true,
          handleScale: true,
        }

        // Create the chart
        const newChart = createChart(chartContainerRef.current, chartOptions)

        // Create a simple line series
        const series = newChart.addLineSeries({
          color: "rgba(76, 175, 80, 1)",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          priceFormat: {
            type: "price",
            precision: 2,
            minMove: 0.01,
          },
          // Add area styling
          lineType: 0,
          topColor: "rgba(76, 175, 80, 0.56)",
          bottomColor: "rgba(76, 175, 80, 0.04)",
          fillOpacity: 0.2,
        })

        // Set the data
        if (data.length > 0) {
          series.setData(data)
        }

        // Fit content to container
        newChart.timeScale().fitContent()

        setChart(newChart)
        setLineSeries(series)
        setChartError(null)
      } catch (error) {
        console.error("Error initializing chart:", error)
        setChartError(error instanceof Error ? error.message : "Failed to initialize chart")
        if (onError) {
          onError()
        }
      }
    }

    initChart()

    // Cleanup on unmount
    return () => {
      if (chart) {
        chart.remove()
        setChart(null)
        setLineSeries(null)
      }
    }
  }, [data, height, isFullScreen, timeScaleVisible, priceScaleVisible, crosshairVisible, gridVisible, onError])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chart && chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullScreen ? window.innerHeight - 100 : height,
        })
        chart.timeScale().fitContent()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [chart, height, isFullScreen])

  // Update data when it changes
  useEffect(() => {
    if (lineSeries && data.length > 0) {
      lineSeries.setData(data)
      if (chart) {
        chart.timeScale().fitContent()
      }
    }
  }, [data, lineSeries, chart])

  // Toggle fullscreen
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  // Download chart as image (fallback implementation)
  const downloadChart = () => {
    if (!chartContainerRef.current) return

    try {
      // Create a canvas element
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas dimensions
      canvas.width = chartContainerRef.current.clientWidth
      canvas.height = chartContainerRef.current.clientHeight

      // Draw background
      ctx.fillStyle = "#1a1b26"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Convert to data URL and download
      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `${title.toLowerCase().replace(/\s+/g, "-")}-chart.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error downloading chart:", error)
    }
  }

  return (
    <Card className={cn("glass-card overflow-hidden", className, isFullScreen && "fixed inset-0 z-50")}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex space-x-2">
          {showDownloadButton && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background/50"
              onClick={downloadChart}
              disabled={isLoading || !data.length || !!chartError}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download chart</span>
            </Button>
          )}
          {showFullScreenButton && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background/50"
              onClick={toggleFullScreen}
              disabled={!!chartError}
            >
              <Maximize2 className="h-4 w-4" />
              <span className="sr-only">Toggle fullscreen</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn("p-0", isFullScreen && "pt-0")}>
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartError ? (
          <div className="flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
            <p className="text-destructive mb-2">Chart error</p>
            <p className="text-muted-foreground text-sm text-center max-w-md px-4">{chartError}</p>
          </div>
        ) : !data.length ? (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <div
            ref={chartContainerRef}
            className="w-full"
            style={{ height: isFullScreen ? "calc(100vh - 100px)" : `${height}px` }}
          />
        )}
      </CardContent>
    </Card>
  )
}
