"use client"

import { useEffect, useRef, memo } from "react"

interface TradingViewWidgetProps {
  symbol?: string
  interval?: string
  theme?: "light" | "dark"
  height?: number | string
  width?: number | string
  autosize?: boolean
  allowSymbolChange?: boolean
}

function TradingViewWidgetComponent({
  symbol = "NASDAQ:AAPL",
  interval = "D",
  theme = "dark",
  height = "100%",
  width = "100%",
  autosize = true,
  allowSymbolChange = true,
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return // Ensure the container exists

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: allowSymbolChange,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_side_toolbar: false,
    })

    // Clean up previous script if it exists
    const existingScript = container.current.querySelector("script")
    if (existingScript) {
      container.current.removeChild(existingScript)
    }

    // Clear previous widget content if any
    while (container.current.firstChild) {
      container.current.removeChild(container.current.firstChild)
    }

    container.current.appendChild(script)

    // Cleanup function to remove the script when the component unmounts
    return () => {
      if (container.current && container.current.contains(script)) {
        try {
          container.current.removeChild(script)
          // Also remove the widget iframe/container TradingView adds
          const widgetContainer = container.current.querySelector(".tradingview-widget-container")
          if (widgetContainer) {
            container.current.removeChild(widgetContainer)
          }
        } catch (error) {
          console.error("Error removing TradingView script:", error)
        }
      }
    }
  }, [symbol, interval, theme, autosize, allowSymbolChange]) // Re-run when these props change

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height, width }}>
      <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
      <div className="tradingview-widget-copyright" style={{ display: "none" }}>
        <a href="https://www.tradingview.com/" rel="noreferrer noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  )
}

export const TradingViewWidget = memo(TradingViewWidgetComponent)
