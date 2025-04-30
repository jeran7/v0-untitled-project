"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Edit, BarChart2, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"

import type { Strategy, Rule } from "@/types/playbook"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface StrategyDetailProps {
  strategyId: string
}

// Helper function to validate UUID format
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function StrategyDetail({ strategyId }: StrategyDetailProps) {
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchStrategy = async () => {
      try {
        setIsLoading(true)

        // Validate UUID format before making the database query
        if (!isValidUUID(strategyId)) {
          throw new Error(`Invalid strategy ID format: ${strategyId}`)
        }

        const { data: strategyData, error: strategyError } = await supabase
          .from("strategies")
          .select("*")
          .eq("id", strategyId)
          .single()

        if (strategyError) throw strategyError

        const { data: rulesData, error: rulesError } = await supabase
          .from("rules")
          .select("*")
          .eq("strategy_id", strategyId)
          .order("priority", { ascending: false })

        if (rulesError) throw rulesError

        // Transform the data to match our Strategy type
        const transformedStrategy: Strategy = {
          id: strategyData.id,
          name: strategyData.name,
          description: strategyData.description,
          category: strategyData.category,
          timeframes: strategyData.timeframes,
          marketConditions: strategyData.market_conditions,
          setupImage: strategyData.setup_image,
          isActive: strategyData.is_active,
          winRate: strategyData.win_rate || 0,
          profitFactor: strategyData.profit_factor || 0,
          avgRMultiple: strategyData.avg_r_multiple || 0,
          usage: strategyData.usage_count || 0,
          complianceScore: strategyData.compliance_score || 0,
          rules: rulesData.map((rule) => ({
            id: rule.id,
            strategyId: rule.strategy_id,
            category: rule.category,
            description: rule.description,
            priority: rule.priority,
            isRequired: rule.is_required,
          })),
          createdAt: new Date(strategyData.created_at),
          updatedAt: new Date(strategyData.updated_at),
        }

        setStrategy(transformedStrategy)
      } catch (error) {
        console.error("Error fetching strategy:", error)
        setError(error instanceof Error ? error.message : "Unknown error")
        toast({
          title: "Error fetching strategy",
          description: error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStrategy()
  }, [strategyId, toast])

  // Group rules by category
  const groupedRules =
    strategy?.rules.reduce(
      (acc, rule) => {
        if (!acc[rule.category]) {
          acc[rule.category] = []
        }
        acc[rule.category].push(rule)
        return acc
      },
      {} as Record<string, Rule[]>,
    ) || {}

  // Calculate the compliance indicator color
  const getComplianceColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded-md"></div>
        <div className="h-64 w-full bg-muted rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error || !strategy) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted/30 p-4 backdrop-blur-sm">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{error ? "Error loading strategy" : "Strategy not found"}</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {error || "The strategy you're looking for doesn't exist or has been deleted."}
        </p>
        <div className="flex gap-4 mt-4">
          <Button onClick={() => router.push("/playbook")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Playbook
          </Button>
          <Button variant="outline" onClick={() => router.push("/playbook/new")}>
            Create New Strategy
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/playbook")} className="pl-0 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Playbook
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/playbook/${strategyId}/performance`)}
            className="bg-background/50 backdrop-blur-sm"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            Performance
          </Button>
          <Button
            onClick={() => router.push(`/playbook/${strategyId}/edit`)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Strategy
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{strategy.name}</h1>
            {!strategy.isActive && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                Archived
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{strategy.description}</p>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px] bg-background/50 backdrop-blur-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1 lg:col-span-2 bg-background/30 backdrop-blur-md border-muted">
              <CardHeader className="pb-2">
                <CardTitle>Setup Example</CardTitle>
                <CardDescription>Visual representation of the strategy setup</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-[300px] w-full rounded-md overflow-hidden">
                  {strategy.setupImage ? (
                    <Image
                      src={strategy.setupImage || "/placeholder.svg"}
                      alt={strategy.name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted/50">
                      <p className="text-sm text-muted-foreground">No setup image available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="col-span-1 space-y-6">
              <Card className="bg-background/30 backdrop-blur-md border-muted">
                <CardHeader className="pb-2">
                  <CardTitle>Strategy Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Category</h4>
                    <Badge className={`${getCategoryColor(strategy.category)}`}>
                      {formatCategoryName(strategy.category)}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Timeframes</h4>
                    <div className="flex flex-wrap gap-2">
                      {strategy.timeframes && strategy.timeframes.length > 0 ? (
                        strategy.timeframes.map((timeframe) => (
                          <Badge key={timeframe} variant="outline" className="bg-secondary/30">
                            {timeframe}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None specified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Market Conditions</h4>
                    <div className="flex flex-wrap gap-2">
                      {strategy.marketConditions && strategy.marketConditions.length > 0 ? (
                        strategy.marketConditions.map((condition) => (
                          <Badge key={condition} variant="outline" className="bg-secondary/30">
                            {condition}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None specified</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/30 backdrop-blur-md border-muted">
                <CardHeader className="pb-2">
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="text-xl font-semibold">{strategy.winRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Profit Factor</p>
                      <p className="text-xl font-semibold">{strategy.profitFactor.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg R-Multiple</p>
                      <p className="text-xl font-semibold">{strategy.avgRMultiple.toFixed(2)}R</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Compliance</p>
                      <p className={`text-xl font-semibold ${getComplianceColor(strategy.complianceScore)}`}>
                        {strategy.complianceScore}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6 mt-6">
          {Object.keys(groupedRules).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted/30 p-4 backdrop-blur-sm">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No rules defined</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                This strategy doesn't have any rules defined yet.
              </p>
              <Button onClick={() => router.push(`/playbook/${strategyId}/edit`)} className="mt-4">
                <Edit className="h-4 w-4 mr-2" />
                Add Rules
              </Button>
            </div>
          ) : (
            Object.entries(groupedRules).map(([category, rules]) => (
              <Card key={category} className="bg-background/30 backdrop-blur-md border-muted">
                <CardHeader>
                  <CardTitle>{formatRuleCategoryName(category)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rules.map((rule) => (
                      <div key={rule.id} className="p-4 rounded-lg bg-background/50 border border-muted">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 rounded-full p-1 ${getPriorityColor(rule.priority)}`}>
                            {rule.priority === 1 ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{rule.description}</p>
                            <div className="flex mt-2">
                              <Badge variant="outline" className={getPriorityBadgeClass(rule.priority)}>
                                {getPriorityLabel(rule.priority)}
                              </Badge>
                              {rule.isRequired && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-blue-500/10 text-blue-500 border-blue-500/20"
                                >
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card className="bg-background/30 backdrop-blur-md border-muted">
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>How well this strategy has performed in your trading</CardDescription>
            </CardHeader>
            <CardContent>
              {strategy.usage > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                      <p className="text-2xl font-bold">{strategy.usage}</p>
                    </div>
                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="text-2xl font-bold">{strategy.winRate}%</p>
                    </div>
                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Profit Factor</p>
                      <p className="text-2xl font-bold">{strategy.profitFactor.toFixed(2)}</p>
                    </div>
                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Avg R-Multiple</p>
                      <p className="text-2xl font-bold">{strategy.avgRMultiple.toFixed(2)}R</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Compliance Impact</h3>
                    <div className="relative h-[300px]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-muted-foreground">Performance chart will be displayed here</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">This strategy hasn't been used in any trades yet.</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/trades/new?strategy=${strategyId}`}>Use in New Trade</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions
function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    breakout: "bg-blue-500/20 text-blue-500",
    support_resistance: "bg-purple-500/20 text-purple-500",
    moving_average: "bg-green-500/20 text-green-500",
    gap: "bg-amber-500/20 text-amber-500",
    pullback: "bg-cyan-500/20 text-cyan-500",
    chart_pattern: "bg-rose-500/20 text-rose-500",
    trend_following: "bg-emerald-500/20 text-emerald-500",
    reversal: "bg-red-500/20 text-red-500",
    volatility: "bg-orange-500/20 text-orange-500",
    custom: "bg-gray-500/20 text-gray-500",
  }
  return colors[category] || "bg-gray-500/20 text-gray-500"
}

function formatCategoryName(category: string) {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function formatRuleCategoryName(category: string) {
  const names: Record<string, string> = {
    precondition: "Market Preconditions",
    entry: "Entry Criteria",
    exit: "Exit Rules",
    management: "Trade Management",
    position_sizing: "Position Sizing",
  }
  return names[category] || formatCategoryName(category)
}

function getPriorityColor(priority: number) {
  const colors: Record<number, string> = {
    1: "bg-red-500/20 text-red-500",
    2: "bg-amber-500/20 text-amber-500",
    3: "bg-blue-500/20 text-blue-500",
  }
  return colors[priority] || "bg-gray-500/20 text-gray-500"
}

function getPriorityBadgeClass(priority: number) {
  const classes: Record<number, string> = {
    1: "bg-red-500/10 text-red-500 border-red-500/20",
    2: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    3: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  }
  return classes[priority] || ""
}

function getPriorityLabel(priority: number) {
  const labels: Record<number, string> = {
    1: "Critical",
    2: "Important",
    3: "Optional",
  }
  return labels[priority] || "Unknown"
}
