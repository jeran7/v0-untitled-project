"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"

export default function TradeAIInsights({ tradeId }: { tradeId: string }) {
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    async function fetchInsights() {
      if (!user) return

      try {
        setLoading(true)

        // Try to fetch existing insights from the database
        const { data, error } = await supabase.from("trade_ai_insights").select("*").eq("trade_id", tradeId).single()

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching insights:", error)
        }

        if (data) {
          setInsights(data)
        } else {
          // If no insights exist, we'll generate them when the user clicks the button
          setInsights(null)
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [tradeId, user])

  const generateInsights = async () => {
    if (!user) return

    try {
      setGenerating(true)

      // Fetch trade data to generate insights
      const { data: tradeData, error: tradeError } = await supabase
        .from("trades")
        .select("*")
        .eq("id", tradeId)
        .single()

      if (tradeError) {
        throw tradeError
      }

      // Generate mock insights based on trade performance
      const isProfitable = (tradeData.profit_loss || 0) > 0
      const mockInsights = {
        trade_id: tradeId,
        performance_analysis: isProfitable
          ? "This trade shows good execution with proper entry and exit points. The profit indicates you followed your trading plan effectively."
          : "This trade shows areas for improvement. The loss suggests a need to review your entry criteria or risk management approach. Consider if you followed your trading plan or if emotions influenced your decisions.",
        strengths: isProfitable
          ? "- Excellent entry timing\n- Proper position sizing\n- Good profit target execution\n- Patience in letting the trade develop"
          : "- Recognized the setup correctly\n- Cut losses before maximum drawdown\n- Documented the trade properly",
        weaknesses: isProfitable
          ? "- Could have increased position size based on conviction\n- Slightly early exit, leaving some profit on the table"
          : "- Entry was against the overall trend\n- Position sizing may have been too large\n- Stop loss placement was too tight",
        improvement_suggestions: isProfitable
          ? "1. Consider scaling out of profitable positions instead of exiting all at once\n2. Track market context more carefully for even better entries\n3. Review your profit-taking strategy to maximize gains"
          : "1. Wait for confirmation before entering trades\n2. Align trades with the overall market direction\n3. Review your pre-trade checklist to avoid similar mistakes",
        pattern_recognition: isProfitable
          ? "This trade follows your typical successful pattern of buying at support levels with confirmation. Continue to focus on these setups."
          : "This trade shows a pattern of entering too early before confirmation. Consider waiting for additional signals before committing capital.",
        created_at: new Date().toISOString(),
      }

      // Save the insights to the database
      const { data, error } = await supabase
        .from("trade_ai_insights")
        .upsert({
          trade_id: tradeId,
          performance_analysis: mockInsights.performance_analysis,
          strengths: mockInsights.strengths,
          weaknesses: mockInsights.weaknesses,
          improvement_suggestions: mockInsights.improvement_suggestions,
          pattern_recognition: mockInsights.pattern_recognition,
          created_at: mockInsights.created_at,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setInsights(mockInsights)
    } catch (err) {
      console.error("Error generating insights:", err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading AI insights...</p>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Sparkles className="h-12 w-12 text-primary mb-4" />
        <h3 className="text-xl font-medium mb-2">Generate AI Insights</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Let AI analyze your trade to identify patterns, strengths, weaknesses, and provide personalized improvement
          suggestions.
        </p>
        <Button onClick={generateInsights} disabled={generating} className="gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Generating Insights..." : "Generate Insights"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">AI Trade Analysis</h3>
        <Button variant="outline" size="sm" className="gap-1" onClick={generateInsights} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="analysis">
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="strengths">Strengths</TabsTrigger>
          <TabsTrigger value="weaknesses">Weaknesses</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>
        <TabsContent value="analysis" className="mt-4">
          <Card className="p-4">
            <p>{insights.performance_analysis}</p>
          </Card>
        </TabsContent>
        <TabsContent value="strengths" className="mt-4">
          <Card className="p-4">
            <pre className="whitespace-pre-wrap font-sans">{insights.strengths}</pre>
          </Card>
        </TabsContent>
        <TabsContent value="weaknesses" className="mt-4">
          <Card className="p-4">
            <pre className="whitespace-pre-wrap font-sans">{insights.weaknesses}</pre>
          </Card>
        </TabsContent>
        <TabsContent value="improvements" className="mt-4">
          <Card className="p-4">
            <pre className="whitespace-pre-wrap font-sans">{insights.improvement_suggestions}</pre>
          </Card>
        </TabsContent>
        <TabsContent value="patterns" className="mt-4">
          <Card className="p-4">
            <p>{insights.pattern_recognition}</p>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="text-xs text-muted-foreground">
        <p>
          AI insights generated on{" "}
          {new Date(insights.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="mt-1">
          Note: These insights are generated by AI and should be used as a supplement to your own analysis.
        </p>
      </div>
    </div>
  )
}
