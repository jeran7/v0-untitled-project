"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, CheckCircle2, Edit } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import type { Strategy, Rule, RuleCategory, RulePriority } from "@/types/playbook"

// Form schema for strategy
const strategyFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string(),
  timeframes: z.array(z.string()).min(1, "Select at least one timeframe"),
  marketConditions: z.array(z.string()).optional(),
})

// Form schema for rule
const ruleFormSchema = z.object({
  description: z.string().min(5, "Description must be at least 5 characters"),
  category: z.string(),
  priority: z.coerce.number().min(1).max(3),
  isRequired: z.boolean().default(false),
})

// Available timeframes
const timeframeOptions = [
  { id: "1m", label: "1 Minute" },
  { id: "5m", label: "5 Minutes" },
  { id: "15m", label: "15 Minutes" },
  { id: "30m", label: "30 Minutes" },
  { id: "1h", label: "1 Hour" },
  { id: "4h", label: "4 Hours" },
  { id: "1d", label: "Daily" },
  { id: "1w", label: "Weekly" },
  { id: "1M", label: "Monthly" },
]

// Available market conditions
const marketConditionOptions = [
  { id: "trending_up", label: "Trending Up" },
  { id: "trending_down", label: "Trending Down" },
  { id: "ranging", label: "Ranging" },
  { id: "high_volatility", label: "High Volatility" },
  { id: "low_volatility", label: "Low Volatility" },
  { id: "breakout", label: "Breakout" },
  { id: "reversal", label: "Reversal" },
]

export default function StrategyEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isNewStrategy, setIsNewStrategy] = useState(false)
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  const supabase = createClient()

  // Strategy form
  const form = useForm<z.infer<typeof strategyFormSchema>>({
    resolver: zodResolver(strategyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "custom",
      timeframes: [],
      marketConditions: [],
    },
  })

  // Rule form
  const ruleForm = useForm<z.infer<typeof ruleFormSchema>>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      description: "",
      category: "entry",
      priority: 2,
      isRequired: false,
    },
  })

  useEffect(() => {
    if (!user) return

    async function fetchStrategyData() {
      try {
        setLoading(true)

        if (params.id === "new") {
          setIsNewStrategy(true)
          setLoading(false)
          return
        }

        // Fetch strategy
        const { data: strategyData, error: strategyError } = await supabase
          .from("strategies")
          .select("*")
          .eq("id", params.id)
          .single()

        if (strategyError) throw strategyError

        // Fetch rules
        const { data: rulesData, error: rulesError } = await supabase
          .from("rules")
          .select("*")
          .eq("strategy_id", params.id)
          .order("order_index", { ascending: true })

        if (rulesError) throw rulesError

        // Set data
        const transformedStrategy: Strategy = {
          id: strategyData.id,
          name: strategyData.name,
          description: strategyData.description,
          category: strategyData.category,
          timeframes: strategyData.timeframes || [],
          marketConditions: strategyData.market_conditions || [],
          setupImage: strategyData.setup_image,
          isActive: strategyData.is_active,
          winRate: strategyData.win_rate || 0,
          profitFactor: strategyData.profit_factor || 0,
          avgRMultiple: strategyData.avg_r_multiple || 0,
          usage: strategyData.usage_count || 0,
          complianceScore: strategyData.compliance_score || 0,
          rules: [],
          createdAt: new Date(strategyData.created_at),
          updatedAt: new Date(strategyData.updated_at),
        }

        setStrategy(transformedStrategy)

        const transformedRules: Rule[] = rulesData.map((rule) => ({
          id: rule.id,
          strategyId: rule.strategy_id,
          category: rule.category,
          description: rule.description,
          priority: rule.priority,
          isRequired: rule.is_required,
        }))

        setRules(transformedRules)

        // Set form values
        form.reset({
          name: strategyData.name,
          description: strategyData.description || "",
          category: strategyData.category,
          timeframes: strategyData.timeframes || [],
          marketConditions: strategyData.market_conditions || [],
        })
      } catch (error) {
        console.error("Error fetching strategy data:", error)
        toast({
          title: "Error",
          description: "Failed to load strategy data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStrategyData()
  }, [user, params.id, form, toast, supabase])

  const onSubmit = async (values: z.infer<typeof strategyFormSchema>) => {
    if (!user) return

    try {
      setSaving(true)

      const strategyData = {
        user_id: user.id,
        name: values.name,
        description: values.description,
        category: values.category,
        timeframes: values.timeframes,
        market_conditions: values.marketConditions || [],
        is_active: true,
      }

      if (isNewStrategy) {
        // Create new strategy
        const { data, error } = await supabase.from("strategies").insert(strategyData).select().single()

        if (error) throw error

        toast({
          title: "Strategy Created",
          description: "Your new strategy has been created successfully",
        })

        // Redirect to the strategy page
        router.push(`/playbook/${data.id}`)
      } else {
        // Update existing strategy
        const { error } = await supabase.from("strategies").update(strategyData).eq("id", params.id)

        if (error) throw error

        toast({
          title: "Strategy Updated",
          description: "Your strategy has been updated successfully",
        })

        // Redirect to the strategy page
        router.push(`/playbook/${params.id}`)
      }
    } catch (error) {
      console.error("Error saving strategy:", error)
      toast({
        title: "Error",
        description: "Failed to save strategy",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const openAddRuleDialog = () => {
    setEditingRule(null)
    ruleForm.reset({
      description: "",
      category: "entry",
      priority: 2,
      isRequired: false,
    })
    setRuleDialogOpen(true)
  }

  const openEditRuleDialog = (rule: Rule) => {
    setEditingRule(rule)
    ruleForm.reset({
      description: rule.description,
      category: rule.category,
      priority: rule.priority,
      isRequired: rule.isRequired,
    })
    setRuleDialogOpen(true)
  }

  const handleSaveRule = async (values: z.infer<typeof ruleFormSchema>) => {
    if (!user) return

    try {
      if (editingRule) {
        // Update existing rule
        const { error } = await supabase
          .from("rules")
          .update({
            description: values.description,
            category: values.category,
            priority: values.priority as RulePriority,
            is_required: values.isRequired,
          })
          .eq("id", editingRule.id)

        if (error) throw error

        // Update local state
        setRules(
          rules.map((rule) =>
            rule.id === editingRule.id
              ? {
                  ...rule,
                  description: values.description,
                  category: values.category as RuleCategory,
                  priority: values.priority as RulePriority,
                  isRequired: values.isRequired,
                }
              : rule,
          ),
        )

        toast({
          title: "Rule Updated",
          description: "The rule has been updated successfully",
        })
      } else {
        // Create new rule
        const newRule = {
          strategy_id: params.id,
          description: values.description,
          category: values.category,
          priority: values.priority,
          is_required: values.isRequired,
          order_index: rules.length,
        }

        const { data, error } = await supabase.from("rules").insert(newRule).select().single()

        if (error) throw error

        // Update local state
        setRules([
          ...rules,
          {
            id: data.id,
            strategyId: data.strategy_id,
            description: data.description,
            category: data.category as RuleCategory,
            priority: data.priority as RulePriority,
            isRequired: data.is_required,
          },
        ])

        toast({
          title: "Rule Added",
          description: "The rule has been added successfully",
        })
      }

      // Close dialog
      setRuleDialogOpen(false)
    } catch (error) {
      console.error("Error saving rule:", error)
      toast({
        title: "Error",
        description: "Failed to save rule",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase.from("rules").delete().eq("id", ruleId)

      if (error) throw error

      // Update local state
      setRules(rules.filter((rule) => rule.id !== ruleId))

      toast({
        title: "Rule Deleted",
        description: "The rule has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting rule:", error)
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      })
    }
  }

  // Group rules by category
  const rulesByCategory = rules.reduce(
    (acc, rule) => {
      if (!acc[rule.category]) {
        acc[rule.category] = []
      }
      acc[rule.category].push(rule)
      return acc
    },
    {} as Record<string, Rule[]>,
  )

  return (
    <div className="flex flex-col gap-6 p-6 animate-in">
      <div className="glass-card rounded-lg p-6 animate-slide-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild className="shrink-0">
              <Link href={isNewStrategy ? "/playbook" : `/playbook/${params.id}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isNewStrategy ? "Create New Strategy" : "Edit Strategy"}
              </h1>
              <p className="text-muted-foreground">
                {isNewStrategy
                  ? "Define a new trading strategy for your playbook"
                  : "Update your existing trading strategy"}
              </p>
            </div>
          </div>
          <Button className="gap-1" onClick={form.handleSubmit(onSubmit)} disabled={saving || loading}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Strategy"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="animate-slide-in" style={{ animationDelay: "150ms" }}>
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="details">Strategy Details</TabsTrigger>
          <TabsTrigger value="rules">Rules & Criteria</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Strategy Information</CardTitle>
              <CardDescription>Define the basic details of your trading strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strategy Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Breakout with Volume Confirmation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your strategy in detail..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="breakout">Breakout</SelectItem>
                            <SelectItem value="support_resistance">Support & Resistance</SelectItem>
                            <SelectItem value="moving_average">Moving Average</SelectItem>
                            <SelectItem value="gap">Gap Trading</SelectItem>
                            <SelectItem value="pullback">Pullback</SelectItem>
                            <SelectItem value="chart_pattern">Chart Pattern</SelectItem>
                            <SelectItem value="trend_following">Trend Following</SelectItem>
                            <SelectItem value="reversal">Reversal</SelectItem>
                            <SelectItem value="volatility">Volatility</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeframes"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Timeframes</FormLabel>
                          <FormDescription>Select the timeframes this strategy works best on</FormDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {timeframeOptions.map((option) => (
                            <FormField
                              key={option.id}
                              control={form.control}
                              name="timeframes"
                              render={({ field }) => {
                                return (
                                  <FormItem key={option.id} className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(option.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, option.id])
                                            : field.onChange(field.value?.filter((value) => value !== option.id))
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">{option.label}</FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marketConditions"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Market Conditions</FormLabel>
                          <FormDescription>Select the market conditions this strategy works best in</FormDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {marketConditionOptions.map((option) => (
                            <FormField
                              key={option.id}
                              control={form.control}
                              name="marketConditions"
                              render={({ field }) => {
                                return (
                                  <FormItem key={option.id} className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(option.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), option.id])
                                            : field.onChange(field.value?.filter((value) => value !== option.id))
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">{option.label}</FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Strategy Rules</CardTitle>
                  <CardDescription>Define the specific rules and criteria for this strategy</CardDescription>
                </div>
                <Button onClick={openAddRuleDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(rulesByCategory).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No rules defined for this strategy yet</p>
                  <Button onClick={openAddRuleDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(rulesByCategory).map(([category, categoryRules]) => (
                    <div key={category} className="space-y-4">
                      <h3 className="text-lg font-medium">{formatRuleCategoryName(category)}</h3>
                      <div className="space-y-3">
                        {categoryRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="flex items-start gap-3 p-3 rounded-md bg-secondary/10 hover:bg-secondary/20 transition-colors"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {rule.priority === 1 ? (
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              ) : (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                <p className="font-medium">{rule.description}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={getPriorityBadgeClass(rule.priority)}>
                                    {getPriorityLabel(rule.priority)}
                                  </Badge>
                                  {rule.isRequired && (
                                    <Badge
                                      variant="outline"
                                      className="bg-blue-500/10 text-blue-500 border-blue-500/20"
                                    >
                                      Required
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditRuleDialog(rule)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Add New Rule"}</DialogTitle>
            <DialogDescription>
              {editingRule ? "Update the details of this rule" : "Define a new rule for your trading strategy"}
            </DialogDescription>
          </DialogHeader>

          <Form {...ruleForm}>
            <form onSubmit={ruleForm.handleSubmit(handleSaveRule)} className="space-y-6">
              <FormField
                control={ruleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Enter only when price breaks above the 20-day high with increased volume"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={ruleForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="precondition">Market Preconditions</SelectItem>
                          <SelectItem value="entry">Entry Criteria</SelectItem>
                          <SelectItem value="exit">Exit Rules</SelectItem>
                          <SelectItem value="management">Trade Management</SelectItem>
                          <SelectItem value="position_sizing">Position Sizing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number.parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Critical (Must Follow)</SelectItem>
                          <SelectItem value="2">Important</SelectItem>
                          <SelectItem value="3">Optional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={ruleForm.control}
                name="isRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Required Rule</FormLabel>
                      <FormDescription>
                        Mark this rule as required if it must be followed for the strategy to be valid
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">{editingRule ? "Update Rule" : "Add Rule"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper functions
function formatRuleCategoryName(category: string) {
  const names: Record<string, string> = {
    precondition: "Market Preconditions",
    entry: "Entry Criteria",
    exit: "Exit Rules",
    management: "Trade Management",
    position_sizing: "Position Sizing",
  }
  return names[category] || category
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
