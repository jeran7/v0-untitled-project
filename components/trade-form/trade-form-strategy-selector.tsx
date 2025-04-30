"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Strategy } from "@/types/database"

interface TradeFormStrategySelectorProps {
  selectedStrategyId: string | null
  onStrategyChange: (strategyId: string | null) => void
}

export function TradeFormStrategySelector({ selectedStrategyId, onStrategyChange }: TradeFormStrategySelectorProps) {
  const [open, setOpen] = useState(false)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)

  const supabase = createClient()
  const { toast } = useToast()

  // Fetch strategies
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("strategies").select("*").eq("is_active", true).order("name")

        if (error) throw error
        setStrategies(data || [])
      } catch (error) {
        console.error("Error fetching strategies:", error)
        toast({
          title: "Error",
          description: "Failed to load strategies. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStrategies()
  }, [supabase, toast])

  // Fetch selected strategy details
  useEffect(() => {
    const fetchSelectedStrategy = async () => {
      if (!selectedStrategyId) {
        setSelectedStrategy(null)
        return
      }

      try {
        const { data, error } = await supabase.from("strategies").select("*").eq("id", selectedStrategyId).single()

        if (error) throw error
        setSelectedStrategy(data)
      } catch (error) {
        console.error("Error fetching selected strategy:", error)
        toast({
          title: "Error",
          description: "Failed to load strategy details. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchSelectedStrategy()
  }, [selectedStrategyId, supabase, toast])

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      breakout: "bg-blue-500/20 text-blue-500",
      reversal: "bg-red-500/20 text-red-500",
      trend_following: "bg-green-500/20 text-green-500",
      pullback: "bg-amber-500/20 text-amber-500",
      support_resistance: "bg-purple-500/20 text-purple-500",
      momentum: "bg-cyan-500/20 text-cyan-500",
      volatility: "bg-orange-500/20 text-orange-500",
      gap: "bg-indigo-500/20 text-indigo-500",
      pattern: "bg-rose-500/20 text-rose-500",
    }
    return colors[category] || "bg-gray-500/20 text-gray-500"
  }

  // Format category name
  const formatCategoryName = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1.5">
        <label
          htmlFor="strategy-selector"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Trading Strategy
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="strategy-selector"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between bg-background/50 border-input/50 hover:bg-background/80"
              disabled={loading}
            >
              {selectedStrategy ? (
                <div className="flex items-center gap-2 truncate">
                  {selectedStrategy.name}
                  <Badge className={cn("ml-2", getCategoryColor(selectedStrategy.category))}>
                    {formatCategoryName(selectedStrategy.category)}
                  </Badge>
                </div>
              ) : (
                "Select a strategy..."
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 bg-background/95 backdrop-blur-md">
            <Command>
              <CommandInput placeholder="Search strategies..." />
              <CommandList>
                <CommandEmpty>No strategies found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {strategies.map((strategy) => (
                    <CommandItem
                      key={strategy.id}
                      value={strategy.name}
                      onSelect={() => {
                        onStrategyChange(strategy.id)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", selectedStrategyId === strategy.id ? "opacity-100" : "opacity-0")}
                      />
                      <div className="flex flex-col">
                        <span>{strategy.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {strategy.description || "No description"}
                        </span>
                      </div>
                      <Badge className={cn("ml-auto", getCategoryColor(strategy.category))}>
                        {formatCategoryName(strategy.category)}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedStrategy && (
        <div className="p-4 rounded-lg bg-background/30 backdrop-blur-md border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{selectedStrategy.name}</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">Strategy Info</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                  <div className="space-y-2">
                    <p className="font-medium">Strategy Details</p>
                    <p className="text-sm">{selectedStrategy.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedStrategy.timeframes?.map((timeframe) => (
                        <Badge key={timeframe} variant="outline">
                          {timeframe}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Win Rate:</span>
              <span className="font-medium">{selectedStrategy.win_rate || 0}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Profit Factor:</span>
              <span className="font-medium">{selectedStrategy.profit_factor?.toFixed(2) || "N/A"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
