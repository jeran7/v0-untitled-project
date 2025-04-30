"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface TradeFormRiskProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  direction: "Long" | "Short"
}

export default function TradeFormRisk({ formData, updateFormData, direction }: TradeFormRiskProps) {
  // Calculate risk metrics when relevant values change
  useEffect(() => {
    calculateRiskMetrics()
  }, [formData.entry, formData.stopLoss, formData.takeProfit, formData.quantity])

  const calculateRiskMetrics = () => {
    const entry = Number.parseFloat(formData.entry?.toString() || "0")
    const stopLoss = Number.parseFloat(formData.stopLoss?.toString() || "0")
    const takeProfit = Number.parseFloat(formData.takeProfit?.toString() || "0")
    const quantity = Number.parseFloat(formData.quantity?.toString() || "0")

    if (entry && stopLoss && takeProfit && quantity) {
      // Calculate risk per share
      const riskPerShare = direction === "Long" ? entry - stopLoss : stopLoss - entry

      // Calculate reward per share
      const rewardPerShare = direction === "Long" ? takeProfit - entry : entry - takeProfit

      // Calculate total risk and reward
      const totalRisk = riskPerShare * quantity
      const totalReward = rewardPerShare * quantity

      // Calculate risk/reward ratio
      const riskReward = rewardPerShare / riskPerShare

      // Calculate R-multiple (based on 1R = risk)
      const rMultiple = rewardPerShare / riskPerShare

      updateFormData("riskReward", riskReward.toFixed(2))
      updateFormData("rMultiple", rMultiple.toFixed(2))
    }
  }

  const handleStopLossChange = (value: string) => {
    updateFormData("stopLoss", Number.parseFloat(value) || 0)
  }

  const handleTakeProfitChange = (value: string) => {
    updateFormData("takeProfit", Number.parseFloat(value) || 0)
  }

  // Calculate distance from entry to stop loss
  const calculateStopDistance = () => {
    const entry = Number.parseFloat(formData.entry?.toString() || "0")
    const stopLoss = Number.parseFloat(formData.stopLoss?.toString() || '0")mData.stopLoss?.toString() || "0')

    if (!entry || !stopLoss) return 0

    const distance = direction === "Long" ? entry - stopLoss : stopLoss - entry

    return distance.toFixed(2)
  }

  // Calculate distance from entry to take profit
  const calculateTakeProfitDistance = () => {
    const entry = Number.parseFloat(formData.entry?.toString() || "0")
    const takeProfit = Number.parseFloat(formData.takeProfit?.toString() || "0")

    if (!entry || !takeProfit) return 0

    const distance = direction === "Long" ? takeProfit - entry : entry - takeProfit

    return distance.toFixed(2)
  }

  // Calculate percentage risk based on account size
  const calculateAccountRisk = () => {
    const entry = Number.parseFloat(formData.entry?.toString() || "0")
    const stopLoss = Number.parseFloat(formData.stopLoss?.toString() || "0")
    const quantity = Number.parseFloat(formData.quantity?.toString() || "0")

    if (!entry || !stopLoss || !quantity) return 0

    const riskPerShare = direction === "Long" ? entry - stopLoss : stopLoss - entry

    const totalRisk = riskPerShare * quantity

    // Assuming account size of $100,000 for demo
    const accountSize = 100000
    const riskPercentage = (totalRisk / accountSize) * 100

    return riskPercentage.toFixed(2)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Parameters */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Risk Parameters</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stop-loss">Stop Loss</Label>
              <Input
                id="stop-loss"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.stopLoss || ""}
                onChange={(e) => handleStopLossChange(e.target.value)}
                className={cn(
                  "bg-background/50",
                  direction === "Long" &&
                    formData.entry &&
                    formData.stopLoss &&
                    formData.stopLoss >= formData.entry &&
                    "border-destructive",
                  direction === "Short" &&
                    formData.entry &&
                    formData.stopLoss &&
                    formData.stopLoss <= formData.entry &&
                    "border-destructive",
                )}
              />
              {direction === "Long" && formData.entry && formData.stopLoss && formData.stopLoss >= formData.entry && (
                <p className="text-xs text-destructive">Stop loss must be below entry price for long positions</p>
              )}
              {direction === "Short" && formData.entry && formData.stopLoss && formData.stopLoss <= formData.entry && (
                <p className="text-xs text-destructive">Stop loss must be above entry price for short positions</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="take-profit">Take Profit</Label>
              <Input
                id="take-profit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.takeProfit || ""}
                onChange={(e) => handleTakeProfitChange(e.target.value)}
                className={cn(
                  "bg-background/50",
                  direction === "Long" &&
                    formData.entry &&
                    formData.takeProfit &&
                    formData.takeProfit <= formData.entry &&
                    "border-destructive",
                  direction === "Short" &&
                    formData.entry &&
                    formData.takeProfit &&
                    formData.takeProfit >= formData.entry &&
                    "border-destructive",
                )}
              />
              {direction === "Long" &&
                formData.entry &&
                formData.takeProfit &&
                formData.takeProfit <= formData.entry && (
                  <p className="text-xs text-destructive">Take profit must be above entry price for long positions</p>
                )}
              {direction === "Short" &&
                formData.entry &&
                formData.takeProfit &&
                formData.takeProfit >= formData.entry && (
                  <p className="text-xs text-destructive">Take profit must be below entry price for short positions</p>
                )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Risk per Share</Label>
            <div className="p-2 border rounded-md bg-background/50 text-[hsl(var(--loss))]">
              ${calculateStopDistance()}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reward per Share</Label>
            <div className="p-2 border rounded-md bg-background/50 text-[hsl(var(--profit))]">
              ${calculateTakeProfitDistance()}
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Risk Analysis</h3>

          <div className="space-y-2">
            <Label>Risk/Reward Ratio</Label>
            <div className="p-2 border rounded-md bg-background/50 font-medium">1:{formData.riskReward || "0.00"}</div>
          </div>

          <div className="space-y-2">
            <Label>R-Multiple</Label>
            <div className="p-2 border rounded-md bg-background/50 font-medium">{formData.rMultiple || "0.00"}R</div>
          </div>

          <div className="space-y-2">
            <Label>Account at Risk</Label>
            <div
              className={cn(
                "p-2 border rounded-md bg-background/50 font-medium",
                Number.parseFloat(calculateAccountRisk()) > 2 ? "text-[hsl(var(--loss))]" : "",
              )}
            >
              {calculateAccountRisk()}%
            </div>
          </div>

          {Number.parseFloat(calculateAccountRisk()) > 2 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Warning: Risk exceeds 2% of account. Consider reducing position size.</AlertDescription>
            </Alert>
          )}

          {formData.riskReward && Number.parseFloat(formData.riskReward) < 2 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Risk/reward ratio is less than 2:1. Consider adjusting your stop loss or take profit.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <Separator />

      {/* Position Size Calculator */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Position Size Calculator</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="account-size">Account Size ($)</Label>
            <Input id="account-size" type="number" defaultValue="100000" className="bg-background/50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk-percentage">Risk Percentage (%)</Label>
            <Input id="risk-percentage" type="number" step="0.1" defaultValue="1" className="bg-background/50" />
          </div>

          <div className="space-y-2">
            <Label>Recommended Position Size</Label>
            <div className="p-2 border rounded-md bg-background/50 font-medium">
              {formData.entry && formData.stopLoss
                ? Math.floor(
                    (100000 * 0.01) /
                      Math.abs(Number.parseFloat(formData.entry) - Number.parseFloat(formData.stopLoss)),
                  )
                : "0"}{" "}
              shares
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 border rounded-md bg-background/20">
          <h4 className="font-medium mb-2">Risk Visualization</h4>
          <div className="h-6 w-full bg-background/50 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                Number.parseFloat(calculateAccountRisk()) > 2 ? "bg-[hsl(var(--loss))]" : "bg-[hsl(var(--profit))]",
              )}
              style={{ width: `${Math.min(Number.parseFloat(calculateAccountRisk()) * 5, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0%</span>
            <span>1%</span>
            <span>2%</span>
            <span>3%</span>
            <span>4%</span>
            <span>5%+</span>
          </div>
        </div>
      </div>
    </div>
  )
}
