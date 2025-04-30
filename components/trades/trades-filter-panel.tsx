"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { TradeFilters } from "@/hooks/use-trades"

interface TradesFilterPanelProps {
  filters: TradeFilters
  onFilterChange: (filters: TradeFilters) => void
  onFilterPreset: (preset: string) => void
}

export function TradesFilterPanel({ filters, onFilterChange, onFilterPreset }: TradesFilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<TradeFilters>(filters)
  const [pnlRange, setPnlRange] = useState<[number, number]>([-5000, 5000])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Apply filters
  const applyFilters = () => {
    onFilterChange(localFilters)
  }

  // Reset filters
  const resetFilters = () => {
    setLocalFilters({})
    setPnlRange([-5000, 5000])
    setSelectedTags([])
    onFilterChange({})
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof TradeFilters, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }

  // Handle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // Mock tags for demo
  const availableTags = [
    { id: "1", name: "Gap Up", color: "#4ade80" },
    { id: "2", name: "Gap Down", color: "#f87171" },
    { id: "3", name: "High Volume", color: "#60a5fa" },
    { id: "4", name: "Low Volume", color: "#a3a3a3" },
    { id: "5", name: "Earnings", color: "#c084fc" },
    { id: "6", name: "News", color: "#facc15" },
    { id: "7", name: "Premarket", color: "#fb923c" },
    { id: "8", name: "Fed Day", color: "#e879f9" },
  ]

  // Mock strategies for demo
  const strategies = [
    "Breakout",
    "Pullback",
    "Trend Following",
    "Reversal",
    "Gap Fill",
    "Momentum",
    "Scalping",
    "Swing",
  ]

  return (
    <div className="glass-card p-6 space-y-6 animate-in slide-in-from-top-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Filter Trades</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset
          </Button>
          <Button size="sm" onClick={applyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !localFilters.startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.startDate ? format(localFilters.startDate, "PPP") : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.startDate}
                    onSelect={(date) => handleFilterChange("startDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !localFilters.endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.endDate ? format(localFilters.endDate, "PPP") : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.endDate}
                    onSelect={(date) => handleFilterChange("endDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onFilterPreset("today")} className="text-xs h-7">
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFilterPreset("week")} className="text-xs h-7">
                Last Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFilterPreset("month")} className="text-xs h-7">
                Last Month
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFilterPreset("ytd")} className="text-xs h-7">
                YTD
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFilterPreset("all")} className="text-xs h-7">
                All Time
              </Button>
            </div>
          </div>
        </div>

        {/* Symbol */}
        <div className="space-y-2">
          <Label>Symbol</Label>
          <Input
            placeholder="AAPL, MSFT, GOOGL..."
            value={localFilters.symbol || ""}
            onChange={(e) => handleFilterChange("symbol", e.target.value)}
          />
        </div>

        {/* Direction */}
        <div className="space-y-2">
          <Label>Direction</Label>
          <RadioGroup
            value={localFilters.direction || ""}
            onValueChange={(value) => handleFilterChange("direction", value || undefined)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Long" id="long" />
              <Label htmlFor="long" className="cursor-pointer">
                Long
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Short" id="short" />
              <Label htmlFor="short" className="cursor-pointer">
                Short
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="both" />
              <Label htmlFor="both" className="cursor-pointer">
                Both
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <RadioGroup
            value={localFilters.status || ""}
            onValueChange={(value) => handleFilterChange("status", value || undefined)}
            className="grid grid-cols-2 gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Win" id="win" />
              <Label htmlFor="win" className="cursor-pointer">
                Win
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Loss" id="loss" />
              <Label htmlFor="loss" className="cursor-pointer">
                Loss
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Open" id="open" />
              <Label htmlFor="open" className="cursor-pointer">
                Open
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="all-status" />
              <Label htmlFor="all-status" className="cursor-pointer">
                All
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Strategy */}
        <div className="space-y-2">
          <Label>Strategy</Label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
            value={localFilters.setup || ""}
            onChange={(e) => handleFilterChange("setup", e.target.value || undefined)}
          >
            <option value="">All Strategies</option>
            {strategies.map((strategy) => (
              <option key={strategy} value={strategy}>
                {strategy}
              </option>
            ))}
          </select>
        </div>

        {/* P&L Range */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>P&L Range</Label>
            <span className="text-sm text-muted-foreground">
              ${pnlRange[0]} to ${pnlRange[1]}
            </span>
          </div>
          <Slider
            defaultValue={pnlRange}
            min={-5000}
            max={5000}
            step={100}
            onValueChange={(value) => setPnlRange(value as [number, number])}
            className="py-4"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2 col-span-1 md:col-span-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {availableTags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer"
                style={{
                  backgroundColor: selectedTags.includes(tag.id) ? tag.color : "transparent",
                  borderColor: tag.color,
                  color: selectedTags.includes(tag.id) ? "#fff" : tag.color,
                }}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(localFilters.symbol ||
        localFilters.direction ||
        localFilters.status ||
        localFilters.setup ||
        selectedTags.length > 0) && (
        <div className="pt-4 border-t border-border/40">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>

            {localFilters.symbol && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Symbol: {localFilters.symbol}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("symbol", undefined)} />
              </Badge>
            )}

            {localFilters.direction && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Direction: {localFilters.direction}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("direction", undefined)} />
              </Badge>
            )}

            {localFilters.status && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {localFilters.status}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("status", undefined)} />
              </Badge>
            )}

            {localFilters.setup && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Strategy: {localFilters.setup}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("setup", undefined)} />
              </Badge>
            )}

            {selectedTags.map((tagId) => {
              const tag = availableTags.find((t) => t.id === tagId)
              if (!tag) return null

              return (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                  style={{ borderColor: tag.color }}
                >
                  Tag: {tag.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTag(tag.id)} />
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
