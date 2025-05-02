"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SubscriptionService } from "@/lib/subscription-service"
import type { SubscriptionPlan, UserSubscription } from "@/types/database"

interface SubscriptionStatusProps {
  userId: string
}

export function SubscriptionStatus({ userId }: SubscriptionStatusProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [tradeUsage, setTradeUsage] = useState({
    current: 0,
    limit: 0,
    percentage: 0,
  })

  useEffect(() => {
    async function loadSubscriptionData() {
      try {
        setLoading(true)

        // Get subscription data
        const { subscription, plan, error, hasActiveSubscription } =
          await SubscriptionService.getUserSubscriptionWithPlan(userId)

        if (error) {
          setError(error)
          return
        }

        if (!hasActiveSubscription) {
          setError("No active subscription found")
          return
        }

        setSubscription(subscription)
        setPlan(plan)

        // Get trade usage
        if (plan) {
          const tradeLimit = await SubscriptionService.checkTradeLimit(userId)
          setTradeUsage({
            current: tradeLimit.currentCount,
            limit: tradeLimit.limit || 0,
            percentage: tradeLimit.limit ? (tradeLimit.currentCount / tradeLimit.limit) * 100 : 0,
          })
        }
      } catch (err) {
        console.error("Error loading subscription data:", err)
        setError("Failed to load subscription information")
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadSubscriptionData()
    }
  }, [userId])

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Manage Subscription
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (!subscription || !plan) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No active subscription found</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Subscribe Now</Button>
        </CardFooter>
      </Card>
    )
  }

  // Format dates
  const periodStart = new Date(subscription.current_period_start).toLocaleDateString()
  const periodEnd = new Date(subscription.current_period_end).toLocaleDateString()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="mr-2">{plan.name}</span>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Active</span>
        </CardTitle>
        <CardDescription>{subscription.is_annual ? "Annual" : "Monthly"} subscription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 inline mr-1" />
            Current period
          </div>
          <div className="text-sm">
            {periodStart} - {periodEnd}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Trade Usage</div>
            <div className="text-sm text-muted-foreground">
              {tradeUsage.current} / {tradeUsage.limit}
            </div>
          </div>
          <Progress value={tradeUsage.percentage} className="h-2" />
        </div>

        {plan.features && (
          <div className="pt-2">
            <div className="text-sm font-medium mb-2">Plan Features</div>
            <ul className="space-y-1">
              {Object.entries(plan.features as Record<string, boolean>).map(([feature, enabled]) => (
                <li key={feature} className="flex items-center text-sm">
                  {enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-300 mr-2" />
                  )}
                  {feature
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Manage Subscription
        </Button>
      </CardFooter>
    </Card>
  )
}
