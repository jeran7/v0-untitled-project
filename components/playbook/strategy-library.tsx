"use client"

import { useState } from "react"
import { useStrategies } from "@/hooks/use-strategies"
import { StrategyCard } from "./strategy-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Search, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export function StrategyLibrary() {
  const { strategies, loading, error } = useStrategies()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")

  // Get unique categories
  const categories = Array.from(new Set(strategies.map((strategy) => strategy.category)))

  // Filter and sort strategies
  const filteredStrategies = strategies
    .filter((strategy) => {
      // Apply search filter
      const matchesSearch =
        strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false

      // Apply category filter
      const matchesCategory = categoryFilter === "all" || strategy.category === categoryFilter

      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "win_rate":
          return (b.win_rate || 0) - (a.win_rate || 0)
        case "profit_factor":
          return (b.profit_factor || 0) - (a.profit_factor || 0)
        case "usage":
          return (b.usage_count || 0) - (a.usage_count || 0)
        default:
          return 0
      }
    })

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search strategies..."
            className="pl-8 bg-background/80 backdrop-blur-[20px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] bg-background/80 backdrop-blur-[20px]">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] bg-background/80 backdrop-blur-[20px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="win_rate">Win Rate</SelectItem>
              <SelectItem value="profit_factor">Profit Factor</SelectItem>
              <SelectItem value="usage">Usage</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/playbook/new">
            <Button className="whitespace-nowrap">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Strategy
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-lg" />
            ))}
        </div>
      ) : filteredStrategies.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No strategies found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || categoryFilter !== "all"
              ? "Try adjusting your filters"
              : "Create your first strategy to get started"}
          </p>
          <Link href="/playbook/new">
            <Button className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Strategy
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStrategies.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} />
          ))}
        </div>
      )}
    </div>
  )
}
