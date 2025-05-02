"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3, BookOpen, LineChart, Plus, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EquityCurveChart } from "@/components/equity-curve-chart"
import { WinRateChart } from "@/components/win-rate-chart"
import { RecentTradesTable } from "@/components/recent-trades-table"
import { PerformanceMetrics } from "@/components/performance-metrics"
import { TradeAnalysis } from "@/components/trade-analysis"
import { supabase } from "@/lib/supabase/client"

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Check authentication and fetch user data
  useEffect(() => {
    async function checkAuth() {
      try {
        console.log("Checking authentication status...")

        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          throw sessionError
        }

        if (!session) {
          console.log("No active session, redirecting to login")
          router.push("/auth/login")
          return
        }

        console.log("Session found, user is authenticated")
        setUser(session.user)

        // Fetch user profile if needed
        if (session.user) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from("user_profiles")
              .select("*")
              .eq("user_id", session.user.id)
              .single()

            if (profileError) {
              console.warn("Could not fetch profile:", profileError)
            } else {
              console.log("Profile fetched successfully")
              setProfile(profileData)
            }
          } catch (profileFetchError) {
            console.error("Profile fetch error:", profileFetchError)
          }
        }
      } catch (err) {
        console.error("Auth check error:", err)
        setError("Failed to verify authentication status")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-10 animate-in">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
          </div>

          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => router.push("/auth/login")} className="mt-4">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No user state (should not happen due to redirect in useEffect)
  if (!user) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to view your dashboard.</p>
            <Button onClick={() => router.push("/auth/login")} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10 animate-in">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {profile?.display_name || user.email?.split("@")[0]}
            </h1>
            <p className="text-muted-foreground">Here's an overview of your trading performance</p>
          </div>
          <Button onClick={() => router.push("/trades/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Trade
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Total P&L</CardDescription>
              <CardTitle className="text-2xl profit-text">+$12,543.87</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +15.3% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Win Rate</CardDescription>
              <CardTitle className="text-2xl">68%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +2.5% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Avg. R Multiple</CardDescription>
              <CardTitle className="text-2xl">2.3R</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +0.4R from last month
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Total Trades</CardDescription>
              <CardTitle className="text-2xl">124</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +18 from last month
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-secondary/30">
            <TabsTrigger value="overview" className="gap-2">
              <LineChart className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="journal" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Journal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Equity Curve</CardTitle>
                </CardHeader>
                <CardContent>
                  <EquityCurveChart />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <WinRateChart />
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentTradesTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceMetrics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journal" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Trade Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <TradeAnalysis />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
