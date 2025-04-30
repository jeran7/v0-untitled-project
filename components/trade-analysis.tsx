"use client"

import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export function TradeAnalysis() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Trade Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entry Price</span>
              <span className="font-medium">$152.45</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exit Price</span>
              <span className="font-medium">$156.78</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stop Loss</span>
              <span className="font-medium">$150.20</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shares</span>
              <span className="font-medium">100</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk Amount</span>
              <span className="font-medium">$225.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reward Amount</span>
              <span className="font-medium">$433.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk/Reward Ratio</span>
              <span className="font-medium">1:1.92</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commission</span>
              <span className="font-medium">$1.99</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Execution Quality</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entry Execution</span>
              <span className="font-medium">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exit Execution</span>
              <span className="font-medium">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stop Placement</span>
              <span className="font-medium">78%</span>
            </div>
            <Progress value={78} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Position Sizing</span>
              <span className="font-medium">65%</span>
            </div>
            <Progress value={65} className="h-2" />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Market Context</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Market Trend</span>
            <span className="font-medium profit-text">Bullish</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sector Performance</span>
            <span className="font-medium profit-text">+1.2%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Volatility (VIX)</span>
            <span className="font-medium">18.45</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Market Breadth</span>
            <span className="font-medium">2.5:1 Advancing</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradeAnalysis
