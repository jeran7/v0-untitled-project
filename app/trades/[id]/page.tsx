"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  Edit,
  LineChart,
  Maximize2,
  Minimize2,
  PencilRuler,
  Plus,
  Star,
  Tag,
  Trash,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { TradingViewWidget } from "@/components/charts/trading-view-widget"
import TradeAIInsights from "@/components/trade-ai-insights"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import type { TradeDetails, TradePsychology } from "@/types/database"
import { TradeStrategyBadge } from "@/components/trade-strategy/trade-strategy-badge"
import { TradeStrategyDetails } from "@/components/trade-strategy/trade-strategy-details"

export default function TradePage({ params }: { params: { id: string } }) {
  const [fullscreen, setFullscreen] = useState(false)
  const [trade, setTrade] = useState<any>(null)
  const [tradeDetails, setTradeDetails] = useState<TradeDetails | null>(null)
  const [tradePsychology, setTradePsychology] = useState<TradePsychology | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    async function fetchTradeData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch the trade data
        const { data: tradeData, error: tradeError } = await supabase
          .from("trades")
          .select("*")
          .eq("id", params.id)
          .single()

        if (tradeError) {
          throw tradeError
        }

        // Fetch trade details
        const { data: detailsData, error: detailsError } = await supabase
          .from("trade_details")
          .select("*")
          .eq("trade_id", params.id)
          .single()

        // Fetch trade psychology data
        const { data: psychologyData, error: psychologyError } = await supabase
          .from("trade_psychology")
          .select("*")
          .eq("trade_id", params.id)
          .single()

        // Set the data
        if (tradeData) {
          console.log("Fetched trade data:", tradeData)
          setTrade(tradeData)
        } else {
          setError("Trade not found")
        }

        if (detailsData) {
          console.log("Fetched trade details:", detailsData)
          setTradeDetails(detailsData)
        }

        if (psychologyData) {
          console.log("Fetched trade psychology:", psychologyData)
          setTradePsychology(psychologyData)
        }
      } catch (err: any) {
        console.error("Error fetching trade:", err)
        setError(err.message || "Failed to load trade data")
        toast({
          title: "Error",
          description: "Failed to load trade data: " + err.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTradeData()
  }, [params.id, user, toast])

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading trade data...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="text-destructive mb-4">Error: {error}</div>
        <Button asChild>
          <Link href="/trades">Back to Trades</Link>
        </Button>
      </div>
    )
  }

  // Show not found state
  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="text-muted-foreground mb-4">Trade not found</div>
        <Button asChild>
          <Link href="/trades">Back to Trades</Link>
        </Button>
      </div>
    )
  }

  // Format date
  const tradeDate = new Date(trade.entry_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Format time
  const tradeTime = trade.entry_date
    ? new Date(trade.entry_date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "N/A"

  // Calculate profit/loss
  const pnl = trade.profit_loss || 0
  const pnlPercent = trade.profit_loss_percent || 0

  // Determine trade status
  const tradeStatus = pnl > 0 ? "Win" : pnl < 0 ? "Loss" : "Breakeven"

  // Calculate R-multiple if risk is available
  const rMultiple =
    tradeDetails?.risk_reward_planned && tradeDetails.risk_reward_planned !== 0
      ? (pnl / Math.abs(tradeDetails.risk_reward_planned)).toFixed(2)
      : "N/A"

  // Calculate holding time if both entry and exit times are available
  let holdingTime = "N/A"
  if (trade.entry_date && trade.exit_date) {
    const entryTime = new Date(trade.entry_date).getTime()
    const exitTime = new Date(trade.exit_date).getTime()
    const diffMs = exitTime - entryTime

    if (diffMs > 0) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      holdingTime = `${hours}h ${minutes}m`
    }
  }

  // Calculate risk/reward ratio
  const riskRewardRatio = tradeDetails?.risk_reward_planned || "N/A"

  // Format symbol for TradingView
  // If it's a stock, prepend NASDAQ: or NYSE: based on some logic
  // For crypto, use BINANCE:BTCUSDT format
  // For forex, use FX:EURUSD format
  const formatSymbolForTradingView = (symbol: string) => {
    // This is a simplified version - you might want to enhance this based on your data
    if (symbol.includes("/")) {
      // Likely forex
      return `FX:${symbol.replace("/", "")}`
    } else if (symbol.includes("-")) {
      // Likely crypto
      return `BINANCE:${symbol.replace("-", "")}`
    } else {
      // Assume stock - you might want to determine exchange based on your data
      return `NASDAQ:${symbol}`
    }
  }

  const tradingViewSymbol = formatSymbolForTradingView(trade.symbol)

  return (
    <div className="flex flex-col gap-6 p-6 animate-in">
      {/* Hero Section */}
      <div className="glass-card rounded-lg p-6 animate-slide-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild className="shrink-0">
              <Link href="/trades">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{trade.symbol}</h1>
                <Badge variant={trade.direction === "long" ? "default" : "secondary"} className="ml-1">
                  {trade.direction === "long" ? "Long" : "Short"}
                </Badge>
                <Badge variant={tradeStatus === "Win" ? "success" : tradeStatus === "Loss" ? "destructive" : "outline"}>
                  {tradeStatus}
                </Badge>
                {tradeDetails?.strategy_id && (
                  <TradeStrategyBadge
                    strategyName={tradeDetails.strategy_name || "Unknown Strategy"}
                    complianceScore={tradeDetails.compliance_score}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {tradeDate}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {tradeTime}
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {tradeDetails?.strategy_id || "N/A"}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className={`text-3xl font-bold ${pnl > 0 ? "profit-text" : pnl < 0 ? "loss-text" : ""}`}>
              {pnl > 0 ? "+" : ""}
              {pnl.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>
                {pnlPercent > 0 ? "+" : ""}
                {pnlPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>R-Multiple</CardDescription>
              <CardTitle className="text-xl">{rMultiple !== "N/A" ? `${rMultiple}R` : rMultiple}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Holding Time</CardDescription>
              <CardTitle className="text-xl">{holdingTime}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Risk/Reward</CardDescription>
              <CardTitle className="text-xl">
                {riskRewardRatio !== "N/A" ? `1:${riskRewardRatio}` : riskRewardRatio}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Trade Rating</CardDescription>
              <CardTitle className="text-xl flex items-center">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < (tradeDetails?.risk_reward_actual || 0) ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
                    />
                  ))}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Chart Section */}
      <Card
        className={`glass-card animate-slide-in ${fullscreen ? "fixed inset-0 z-50 m-4 overflow-auto" : ""}`}
        style={{ animationDelay: "150ms" }}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Price Chart</CardTitle>
            <CardDescription>Price action and execution points</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <PencilRuler className="h-4 w-4" />
              <span>Annotate</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setFullscreen(!fullscreen)}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className={`w-full ${fullscreen ? "h-[calc(100vh-200px)]" : "h-[500px]"}`}>
            <TradingViewWidget
              symbol={tradingViewSymbol}
              interval={trade.timeframe || "D"}
              theme="dark"
              autosize={true}
              allowSymbolChange={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trade Details Section */}
      <div className="grid gap-6 md:grid-cols-2 animate-slide-in" style={{ animationDelay: "200ms" }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Entry & Exit Details</CardTitle>
            <CardDescription>Trade execution information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Entry</h4>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="font-medium">${trade.entry_price?.toFixed(2) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Time</span>
                    <span className="font-medium">{tradeTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Shares/Contracts</span>
                    <span className="font-medium">{trade.quantity || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Exit</h4>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="font-medium">${trade.exit_price?.toFixed(2) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Time</span>
                    <span className="font-medium">
                      {trade.exit_date
                        ? new Date(trade.exit_date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Shares/Contracts</span>
                    <span className="font-medium">{trade.quantity || "N/A"}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Risk Management</h4>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Stop Loss</span>
                  <span className="font-medium">${tradeDetails?.stop_loss?.toFixed(2) || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Take Profit</span>
                  <span className="font-medium">${tradeDetails?.take_profit?.toFixed(2) || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Risk per Share</span>
                  <span className="font-medium">
                    {trade.entry_price && tradeDetails?.stop_loss
                      ? `$${Math.abs(trade.entry_price - tradeDetails.stop_loss).toFixed(2)}`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Risk & Reward Analysis</CardTitle>
            <CardDescription>Planned vs. actual performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Planned Risk</span>
                  <span className="font-medium">${tradeDetails?.risk_reward_planned?.toFixed(2) || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Actual Risk</span>
                  <span className="font-medium">${tradeDetails?.risk_reward_actual?.toFixed(2) || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Planned Reward</span>
                  <span className="font-medium">${tradeDetails?.take_profit?.toFixed(2) || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Actual Reward</span>
                  <span className="font-medium">${Math.max(0, pnl).toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Costs</h4>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Commission</span>
                  <span className="font-medium">${trade.commission?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fees</span>
                  <span className="font-medium">${trade.fees?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Costs</span>
                  <span className="font-medium">${((trade.commission || 0) + (trade.fees || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Net P&L</span>
                  <span className={`font-medium ${pnl > 0 ? "profit-text" : pnl < 0 ? "loss-text" : ""}`}>
                    ${(pnl - (trade.commission || 0) - (trade.fees || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journal Section */}
      <Tabs defaultValue="notes" className="animate-slide-in" style={{ animationDelay: "250ms" }}>
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
          <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="notes" className="mt-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Trade Notes</h3>
                  <p className="text-muted-foreground">{tradeDetails?.notes || "No notes available for this trade."}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="psychology" className="mt-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Emotional State</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Confidence</span>
                          <span className="font-medium">
                            {tradePsychology?.confidence_level
                              ? `${tradePsychology.confidence_level}/10`
                              : "Not recorded"}
                          </span>
                        </div>
                        <Slider
                          defaultValue={[tradePsychology?.confidence_level || 5]}
                          max={10}
                          step={1}
                          className="w-full"
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Focus</span>
                          <span className="font-medium">
                            {tradePsychology?.focus_level ? `${tradePsychology.focus_level}/10` : "Not recorded"}
                          </span>
                        </div>
                        <Slider
                          defaultValue={[tradePsychology?.focus_level || 5]}
                          max={10}
                          step={1}
                          className="w-full"
                          disabled
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stress Level</span>
                          <span className="font-medium">
                            {tradePsychology?.stress_level ? `${tradePsychology.stress_level}/10` : "Not recorded"}
                          </span>
                        </div>
                        <Slider
                          defaultValue={[tradePsychology?.stress_level || 5]}
                          max={10}
                          step={1}
                          className="w-full"
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discipline</span>
                          <span className="font-medium">
                            {tradePsychology?.discipline_level
                              ? `${tradePsychology.discipline_level}/10`
                              : "Not recorded"}
                          </span>
                        </div>
                        <Slider
                          defaultValue={[tradePsychology?.discipline_level || 5]}
                          max={10}
                          step={1}
                          className="w-full"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Decision Making</h3>
                  <p className="text-muted-foreground">
                    {tradePsychology?.decision_making_notes || "No psychology notes available for this trade."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="mistakes" className="mt-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Mistakes Made</h3>
                  <p className="text-muted-foreground">No mistakes recorded for this trade.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lessons" className="mt-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">What Went Well</h3>
                  <p className="text-muted-foreground">No notes on what went well for this trade.</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">What Could Improve</h3>
                  <p className="text-muted-foreground">No notes on what could improve for this trade.</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Lessons Learned</h3>
                  <p className="text-muted-foreground">No lessons learned recorded for this trade.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="strategy" className="mt-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <TradeStrategyDetails tradeId={params.id} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <TradeAIInsights tradeId={params.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-2 animate-slide-in" style={{ animationDelay: "400ms" }}>
        <Button variant="outline" className="gap-1" asChild>
          <Link href={`/trades/edit/${params.id}`}>
            <Edit className="h-4 w-4" />
            Edit Trade
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              More Actions
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <LineChart className="mr-2 h-4 w-4" />
              Compare with Similar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Plus className="mr-2 h-4 w-4" />
              Add to Playbook
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash className="mr-2 h-4 w-4" />
              Delete Trade
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
