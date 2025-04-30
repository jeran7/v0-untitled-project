"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Plus, Save, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import TradeFormBasic from "@/components/trade-form/trade-form-basic"
import TradeFormRisk from "@/components/trade-form/trade-form-risk"
import TradeFormPsychology from "@/components/trade-form/trade-form-psychology"
import TradeFormNotes from "@/components/trade-form/trade-form-notes"
import TradeFormImages from "@/components/trade-form/trade-form-images"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { TradeFormStrategy } from "@/components/trade-form/trade-form-strategy"
import { useForm } from "react-hook-form"
import type { ComplianceData } from "@/components/trade-strategy/trade-strategy-connection"

// Mock data for symbols and strategies
const symbols = [
  { value: "AAPL", label: "Apple Inc. (AAPL)" },
  { value: "MSFT", label: "Microsoft Corporation (MSFT)" },
  { value: "GOOGL", label: "Alphabet Inc. (GOOGL)" },
  { value: "AMZN", label: "Amazon.com Inc. (AMZN)" },
  { value: "TSLA", label: "Tesla Inc. (TSLA)" },
  { value: "META", label: "Meta Platforms Inc. (META)" },
  { value: "NVDA", label: "NVIDIA Corporation (NVDA)" },
  { value: "BTC-USD", label: "Bitcoin (BTC-USD)" },
  { value: "ETH-USD", label: "Ethereum (ETH-USD)" },
  { value: "EUR-USD", label: "Euro/US Dollar (EUR-USD)" },
]

export default function NewTradePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  const [symbol, setSymbol] = useState("")
  const [openSymbol, setOpenSymbol] = useState(false)
  const [direction, setDirection] = useState<"Long" | "Short">("Long")
  const [strategy, setStrategy] = useState("")
  const [openStrategy, setOpenStrategy] = useState(false)
  const [date, setDate] = useState<Date>(new Date())
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
  const [strategyId, setStrategyId] = useState<string | null>(null)
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)

  // Form data state
  const [formData, setFormData] = useState({
    entry: 0,
    exit: 0,
    quantity: 0,
    stopLoss: 0,
    takeProfit: 0,
    commission: 0,
    fees: 0,
    pnl: 0,
    riskReward: 0,
    rMultiple: 0,
    confidence: 80,
    focus: 90,
    stress: 25,
    fomo: 15,
    patience: 65,
    discipline: 85,
    notes: "",
    wentWell: "",
    couldImprove: "",
    lessons: "",
    setupDescription: "",
    marketContext: "",
    decisionMaking: "",
    sleepQuality: "good",
    physicalState: "normal",
    environment: "quiet",
    distractions: "none",
    tradingTime: "market-open",
  })

  const form = useForm()

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle strategy change
  const handleStrategyChange = (newStrategyId: string | null, newStrategy: any) => {
    setStrategyId(newStrategyId)
    if (newStrategy) {
      setStrategy(newStrategy.name)
    } else {
      setStrategy("")
    }
  }

  // Handle compliance change
  const handleComplianceChange = (compliance: ComplianceData) => {
    setComplianceData(compliance)
  }

  // Function to validate the form data
  const validateForm = () => {
    if (!symbol) {
      toast({
        title: "Missing Symbol",
        description: "Please select a symbol for your trade.",
        variant: "destructive",
      })
      return false
    }

    if (!formData.entry || formData.entry <= 0) {
      toast({
        title: "Invalid Entry Price",
        description: "Please enter a valid entry price.",
        variant: "destructive",
      })
      return false
    }

    if (!formData.quantity || formData.quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Function to save the trade as a draft
  const saveDraft = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save a draft.",
        variant: "destructive",
      })
      return
    }

    if (!symbol) {
      toast({
        title: "Missing Symbol",
        description: "Please select a symbol before saving a draft.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSavingDraft(true)

      // Create a draft trade object
      const draftTrade = {
        user_id: user.id,
        symbol: symbol,
        direction: direction.toLowerCase(),
        entry_price: formData.entry || 0,
        quantity: formData.quantity || 0,
        entry_date: new Date().toISOString(),
        fees: formData.fees || 0,
        commission: formData.commission || 0,
        status: "open",
        import_source: "manual",
        strategy_id: strategyId,
      }

      // Insert the draft trade into Supabase
      const { data: tradeData, error: tradeError } = await supabase.from("trades").insert(draftTrade).select().single()

      if (tradeError) {
        throw new Error(tradeError.message)
      }

      // Save trade details if available
      if (formData.stopLoss || formData.takeProfit) {
        const tradeDetails = {
          trade_id: tradeData.id,
          stop_loss: formData.stopLoss || null,
          take_profit: formData.takeProfit || null,
          strategy_id: strategyId || null,
          risk_reward_planned: formData.riskReward || null,
          notes: formData.notes || null,
        }

        const { error: detailsError } = await supabase.from("trade_details").insert(tradeDetails)

        if (detailsError) {
          console.error("Error saving trade details:", detailsError)
        }
      }

      // Save psychology data if available
      const psychologyData = {
        trade_id: tradeData.id,
        confidence_level: formData.confidence || null,
        focus_level: formData.focus || null,
        stress_level: formData.stress || null,
        fomo_level: formData.fomo || null,
        patience_level: formData.patience || null,
        discipline_level: formData.discipline || null,
        sleep_quality: formData.sleepQuality || null,
        physical_state: formData.physicalState || null,
        environment: formData.environment || null,
        distractions: formData.distractions || null,
        decision_making_notes: formData.decisionMaking || null,
      }

      const { error: psychologyError } = await supabase.from("trade_psychology").insert(psychologyData)

      if (psychologyError) {
        console.error("Error saving psychology data:", psychologyError)
      }

      // Save strategy compliance data if available
      if (strategyId && complianceData) {
        const complianceRecord = {
          trade_id: tradeData.id,
          strategy_id: strategyId,
          compliance_score: complianceData.score,
          notes: complianceData.notes,
        }

        const { data: complianceDataResult, error: complianceError } = await supabase
          .from("trade_strategy_compliance")
          .insert(complianceRecord)
          .select()
          .single()

        if (complianceError) {
          console.error("Error saving compliance data:", complianceError)
        } else {
          // Save individual rule compliance records
          const ruleComplianceRecords = complianceData.ruleCompliance.map((rule) => ({
            trade_strategy_compliance_id: complianceDataResult.id,
            rule_id: rule.ruleId,
            was_followed: rule.followed,
            notes: rule.notes || null,
          }))

          const { error: ruleComplianceError } = await supabase.from("rule_compliance").insert(ruleComplianceRecords)

          if (ruleComplianceError) {
            console.error("Error saving rule compliance data:", ruleComplianceError)
          }
        }
      }

      toast({
        title: "Draft Saved",
        description: "Your trade draft has been saved successfully.",
      })

      // Redirect to the trades page
      router.push("/trades")
    } catch (error) {
      console.error("Error saving draft:", error)
      toast({
        title: "Error Saving Draft",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Function to create a new trade
  const createTrade = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a trade.",
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      // Create a new trade object
      const newTrade = {
        user_id: user.id,
        symbol: symbol,
        direction: direction.toLowerCase(),
        entry_price: formData.entry,
        exit_price: formData.exit || null,
        entry_date: new Date(date).toISOString(),
        exit_date: formData.exit ? new Date(date).toISOString() : null,
        quantity: formData.quantity,
        fees: formData.fees || 0,
        commission: formData.commission || 0,
        status: formData.exit ? "closed" : "open",
        import_source: "manual",
        strategy_id: strategyId,
      }

      // Insert the new trade into Supabase
      const { data: tradeData, error: tradeError } = await supabase.from("trades").insert(newTrade).select().single()

      if (tradeError) {
        throw new Error(tradeError.message)
      }

      // Calculate profit/loss for trade details
      let profitLoss = formData.pnl
      if (!profitLoss && formData.entry && formData.exit) {
        if (direction === "Long") {
          profitLoss = (formData.exit - formData.entry) * formData.quantity
        } else {
          profitLoss = (formData.entry - formData.exit) * formData.quantity
        }
        profitLoss -= (formData.commission || 0) + (formData.fees || 0)
      }

      // Save trade details
      const tradeDetails = {
        trade_id: tradeData.id,
        stop_loss: formData.stopLoss || null,
        take_profit: formData.takeProfit || null,
        strategy_id: strategyId || null,
        risk_reward_planned: formData.riskReward || null,
        risk_reward_actual:
          formData.exit && formData.stopLoss ? profitLoss / (formData.entry - formData.stopLoss) : null,
        notes: formData.notes || null,
      }

      const { error: detailsError } = await supabase.from("trade_details").insert(tradeDetails)

      if (detailsError) {
        console.error("Error saving trade details:", detailsError)
      }

      // Save psychology data
      const psychologyData = {
        trade_id: tradeData.id,
        confidence_level: formData.confidence || null,
        focus_level: formData.focus || null,
        stress_level: formData.stress || null,
        fomo_level: formData.fomo || null,
        patience_level: formData.patience || null,
        discipline_level: formData.discipline || null,
        sleep_quality: formData.sleepQuality || null,
        physical_state: formData.physicalState || null,
        environment: formData.environment || null,
        distractions: formData.distractions || null,
        decision_making_notes: formData.decisionMaking || null,
      }

      const { error: psychologyError } = await supabase.from("trade_psychology").insert(psychologyData)

      if (psychologyError) {
        console.error("Error saving psychology data:", psychologyError)
      }

      // Save strategy compliance data if available
      if (strategyId && complianceData) {
        const complianceRecord = {
          trade_id: tradeData.id,
          strategy_id: strategyId,
          compliance_score: complianceData.score,
          notes: complianceData.notes,
        }

        const { data: complianceResult, error: complianceError } = await supabase
          .from("trade_strategy_compliance")
          .insert(complianceRecord)
          .select()
          .single()

        if (complianceError) {
          console.error("Error saving compliance data:", complianceError)
        } else {
          // Save individual rule compliance records
          const ruleComplianceRecords = complianceData.ruleCompliance.map((rule) => ({
            trade_strategy_compliance_id: complianceResult.id,
            rule_id: rule.ruleId,
            was_followed: rule.followed,
            notes: rule.notes || null,
          }))

          const { error: ruleComplianceError } = await supabase.from("rule_compliance").insert(ruleComplianceRecords)

          if (ruleComplianceError) {
            console.error("Error saving rule compliance data:", ruleComplianceError)
          }
        }
      }

      // If the trade is closed (has exit price), update the profit_loss in a separate query
      if (formData.exit) {
        const { error: updateError } = await supabase
          .from("trades")
          .update({
            profit_loss: profitLoss,
            profit_loss_percent: (profitLoss / (formData.entry * formData.quantity)) * 100,
          })
          .eq("id", tradeData.id)

        if (updateError) {
          console.error("Error updating profit/loss:", updateError)
        }
      }

      toast({
        title: "Trade Created",
        description: "Your trade has been created successfully.",
      })

      // Redirect to the trades page
      router.push("/trades")
    } catch (error) {
      console.error("Error creating trade:", error)
      toast({
        title: "Error Creating Trade",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container relative">
      <Link href="/trades" className="absolute left-0 top-0">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>
      <div className="flex items-center justify-center space-x-2">
        <h1 className="text-2xl font-semibold tracking-tight">New Trade</h1>
      </div>
      <Card className="mt-4">
        <CardContent className="p-4">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="psychology">Psychology</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Popover open={openSymbol} onOpenChange={setOpenSymbol}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSymbol}
                        className="w-full justify-between"
                      >
                        {symbol ? symbols.find((s) => s.value === symbol)?.label : "Select symbol..."}
                        <Tag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search symbol..." />
                        <CommandList>
                          <CommandEmpty>No symbol found.</CommandEmpty>
                          <CommandGroup>
                            {symbols.map((symbol) => (
                              <CommandItem
                                key={symbol.value}
                                value={symbol.value}
                                onSelect={() => {
                                  setSymbol(symbol.value)
                                  setOpenSymbol(false)
                                }}
                              >
                                {symbol.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-1/2 justify-center",
                      direction === "Long" ? "bg-green-500 text-white hover:bg-green-700" : "",
                    )}
                    onClick={() => setDirection("Long")}
                  >
                    Long
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-1/2 justify-center",
                      direction === "Short" ? "bg-red-500 text-white hover:bg-red-700" : "",
                    )}
                    onClick={() => setDirection("Short")}
                  >
                    Short
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? new Date(date).toLocaleDateString() : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    {/* <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    /> */}
                  </PopoverContent>
                </Popover>
                <div>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <TradeFormBasic formData={formData} updateFormData={updateFormData} />
            </TabsContent>
            <TabsContent value="risk">
              <TradeFormRisk formData={formData} updateFormData={updateFormData} />
            </TabsContent>
            <TabsContent value="psychology">
              <TradeFormPsychology formData={formData} updateFormData={updateFormData} />
            </TabsContent>
            <TabsContent value="strategy">
              <TradeFormStrategy
                strategyId={strategyId}
                onStrategyChange={handleStrategyChange}
                onComplianceChange={handleComplianceChange}
              />
            </TabsContent>
            <TabsContent value="notes">
              <TradeFormNotes formData={formData} updateFormData={updateFormData} />
            </TabsContent>
            <TabsContent value="images">
              <TradeFormImages />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-end space-x-2">
        <Button variant="secondary" onClick={saveDraft} disabled={isSavingDraft}>
          {isSavingDraft ? "Saving..." : "Save Draft"}
          <Save className="ml-2 h-4 w-4" />
        </Button>
        <Button onClick={createTrade} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Trade"}
          <Plus className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
