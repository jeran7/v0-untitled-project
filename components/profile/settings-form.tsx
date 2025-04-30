"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Icons } from "@/components/ui/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { UserSettings } from "@/types/database"

export function SettingsForm() {
  const { settings, updateSettings, isLoading } = useAuth()
  const [formValues, setFormValues] = useState<Partial<UserSettings>>({
    default_risk_percentage: 1,
    default_reward_risk_ratio: 2,
    theme: "dark",
    enable_email_notifications: true,
    enable_trade_reminders: true,
    enable_performance_alerts: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Initialize form with settings data
  useEffect(() => {
    if (settings) {
      setFormValues({
        default_risk_percentage: settings.default_risk_percentage || 1,
        default_reward_risk_ratio: settings.default_reward_risk_ratio || 2,
        theme: settings.theme || "dark",
        enable_email_notifications: settings.enable_email_notifications ?? true,
        enable_trade_reminders: settings.enable_trade_reminders ?? true,
        enable_performance_alerts: settings.enable_performance_alerts ?? true,
      })
    }
  }, [settings])

  const handleNumberChange = (name: string, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      setFormValues((prev) => ({ ...prev, [name]: numValue }))
    }
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormValues((prev) => ({ ...prev, [name]: checked }))
  }

  const handleThemeChange = (theme: string) => {
    setFormValues((prev) => ({ ...prev, theme }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    try {
      const { success, error } = await updateSettings(formValues)
      if (!success) {
        throw new Error(error || "Failed to update settings")
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Your settings have been updated successfully.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Trading Defaults</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_risk_percentage">Default Risk Percentage (%)</Label>
              <Input
                id="default_risk_percentage"
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={formValues.default_risk_percentage || 1}
                onChange={(e) => handleNumberChange("default_risk_percentage", e.target.value)}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">Default percentage of account to risk per trade</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_reward_risk_ratio">Default Reward/Risk Ratio</Label>
              <Input
                id="default_reward_risk_ratio"
                type="number"
                step="0.1"
                min="0.5"
                value={formValues.default_reward_risk_ratio || 2}
                onChange={(e) => handleNumberChange("default_reward_risk_ratio", e.target.value)}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">Default reward to risk ratio for trade planning</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Theme</h3>

          <div className="flex flex-wrap gap-4">
            <div
              className={`relative h-20 w-24 cursor-pointer rounded-md border p-1 ${
                formValues.theme === "dark" ? "border-primary ring-2 ring-primary" : "border-border"
              }`}
              onClick={() => handleThemeChange("dark")}
            >
              <div className="absolute inset-0 m-1 rounded bg-background"></div>
              <div className="absolute bottom-2 left-2 right-2 h-3 rounded bg-primary/20"></div>
              <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"></div>
              <span className="absolute bottom-1 left-0 right-0 text-center text-xs">Dark</span>
            </div>

            <div
              className={`relative h-20 w-24 cursor-pointer rounded-md border p-1 ${
                formValues.theme === "light" ? "border-primary ring-2 ring-primary" : "border-border"
              }`}
              onClick={() => handleThemeChange("light")}
            >
              <div className="absolute inset-0 m-1 rounded bg-white"></div>
              <div className="absolute bottom-2 left-2 right-2 h-3 rounded bg-gray-200"></div>
              <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"></div>
              <span className="absolute bottom-1 left-0 right-0 text-center text-xs text-gray-700">Light</span>
            </div>

            <div
              className={`relative h-20 w-24 cursor-pointer rounded-md border p-1 ${
                formValues.theme === "system" ? "border-primary ring-2 ring-primary" : "border-border"
              }`}
              onClick={() => handleThemeChange("system")}
            >
              <div className="absolute inset-0 m-1 rounded bg-gradient-to-br from-white to-background"></div>
              <div className="absolute bottom-2 left-2 right-2 h-3 rounded bg-gradient-to-r from-gray-200 to-gray-700"></div>
              <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"></div>
              <span className="absolute bottom-1 left-0 right-0 text-center text-xs">System</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notifications</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_notifications">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive important updates via email</p>
              </div>
              <Switch
                id="email_notifications"
                checked={formValues.enable_email_notifications ?? true}
                onCheckedChange={(checked) => handleSwitchChange("enable_email_notifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="trade_reminders">Trade Reminders</Label>
                <p className="text-xs text-muted-foreground">Get reminders about planned trades</p>
              </div>
              <Switch
                id="trade_reminders"
                checked={formValues.enable_trade_reminders ?? true}
                onCheckedChange={(checked) => handleSwitchChange("enable_trade_reminders", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="performance_alerts">Performance Alerts</Label>
                <p className="text-xs text-muted-foreground">Receive alerts about your trading performance</p>
              </div>
              <Switch
                id="performance_alerts"
                checked={formValues.enable_performance_alerts ?? true}
                onCheckedChange={(checked) => handleSwitchChange("enable_performance_alerts", checked)}
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </form>
    </div>
  )
}
