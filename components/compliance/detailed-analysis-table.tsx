"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DownloadIcon, ArrowUpDown, Search, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import type { ComplianceData } from "@/hooks/use-compliance-data"

interface DetailedAnalysisTableProps {
  data: ComplianceData | null
  loading: boolean
}

type SortField = "date" | "symbol" | "strategy" | "compliance" | "outcome"
type SortDirection = "asc" | "desc"

export function DetailedAnalysisTable({ data, loading }: DetailedAnalysisTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [strategyFilter, setStrategyFilter] = useState<string>("all")
  const [complianceFilter, setComplianceFilter] = useState<string>("all")

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Detailed Analysis Table</CardTitle>
          <CardDescription>Analyze individual trades and their compliance with strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Detailed Analysis Table</CardTitle>
          <CardDescription>Analyze individual trades and their compliance with strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No trade data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare trade data from compliance data
  // This is a simplified version - in a real app, you'd have more detailed trade data
  const tradeData = data.complianceByStrategy.flatMap((strategy) => {
    return Array(strategy.totalTrades)
      .fill(null)
      .map((_, index) => ({
        id: `trade-${strategy.strategyId}-${index}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        symbol: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"][Math.floor(Math.random() * 5)],
        strategy: strategy.strategyName,
        strategyId: strategy.strategyId,
        compliance: Math.random(),
        outcome: Math.random() > 0.5 ? "win" : "loss",
        pnl: Math.random() > 0.5 ? Math.floor(Math.random() * 1000) : -Math.floor(Math.random() * 1000),
      }))
  })

  // Get unique strategies for filter
  const strategies = Array.from(new Set(tradeData.map((trade) => trade.strategy)))

  // Apply filters
  let filteredTrades = [...tradeData]

  if (searchTerm) {
    filteredTrades = filteredTrades.filter(
      (trade) =>
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.strategy.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  if (strategyFilter !== "all") {
    filteredTrades = filteredTrades.filter((trade) => trade.strategy === strategyFilter)
  }

  if (complianceFilter !== "all") {
    switch (complianceFilter) {
      case "full":
        filteredTrades = filteredTrades.filter((trade) => trade.compliance === 1)
        break
      case "high":
        filteredTrades = filteredTrades.filter((trade) => trade.compliance >= 0.75 && trade.compliance < 1)
        break
      case "medium":
        filteredTrades = filteredTrades.filter((trade) => trade.compliance >= 0.5 && trade.compliance < 0.75)
        break
      case "low":
        filteredTrades = filteredTrades.filter((trade) => trade.compliance > 0 && trade.compliance < 0.5)
        break
      case "none":
        filteredTrades = filteredTrades.filter((trade) => trade.compliance === 0)
        break
    }
  }

  // Apply sorting
  filteredTrades.sort((a, b) => {
    switch (sortField) {
      case "date":
        return sortDirection === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime()
      case "symbol":
        return sortDirection === "asc" ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol)
      case "strategy":
        return sortDirection === "asc" ? a.strategy.localeCompare(b.strategy) : b.strategy.localeCompare(a.strategy)
      case "compliance":
        return sortDirection === "asc" ? a.compliance - b.compliance : b.compliance - a.compliance
      case "outcome":
        if (sortDirection === "asc") {
          if (a.outcome === b.outcome) return 0
          return a.outcome === "win" ? 1 : -1
        } else {
          if (a.outcome === b.outcome) return 0
          return a.outcome === "win" ? -1 : 1
        }
      default:
        return 0
    }
  })

  // Handle sort toggle
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle export
  const exportToCSV = () => {
    const headers = ["Date", "Symbol", "Strategy", "Compliance", "Outcome", "P&L"]
    const csvContent = [
      headers.join(","),
      ...filteredTrades.map((trade) =>
        [
          trade.date,
          trade.symbol,
          trade.strategy,
          (trade.compliance * 100).toFixed(1) + "%",
          trade.outcome,
          trade.pnl,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "trade-compliance-analysis.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Detailed Analysis Table</CardTitle>
            <CardDescription>Analyze individual trades and their compliance with strategies</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by symbol or strategy..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={strategyFilter} onValueChange={setStrategyFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                {strategies.map((strategy) => (
                  <SelectItem key={strategy} value={strategy}>
                    {strategy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={complianceFilter} onValueChange={setComplianceFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Compliance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Compliance</SelectItem>
                <SelectItem value="full">Full (100%)</SelectItem>
                <SelectItem value="high">High (75-99%)</SelectItem>
                <SelectItem value="medium">Medium (50-74%)</SelectItem>
                <SelectItem value="low">Low (1-49%)</SelectItem>
                <SelectItem value="none">None (0%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => toggleSort("date")} className="cursor-pointer">
                    <div className="flex items-center">
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("symbol")} className="cursor-pointer">
                    <div className="flex items-center">
                      Symbol
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("strategy")} className="cursor-pointer">
                    <div className="flex items-center">
                      Strategy
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("compliance")} className="cursor-pointer">
                    <div className="flex items-center">
                      Compliance
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("outcome")} className="cursor-pointer">
                    <div className="flex items-center">
                      Outcome
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.length > 0 ? (
                  filteredTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>{trade.date}</TableCell>
                      <TableCell>{trade.symbol}</TableCell>
                      <TableCell>{trade.strategy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {trade.compliance === 1 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : trade.compliance === 0 ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                          <span>{(trade.compliance * 100).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={trade.outcome === "win" ? "success" : "destructive"}>
                          {trade.outcome === "win" ? "Win" : "Loss"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right ${trade.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {trade.pnl >= 0 ? "+" : ""}
                        {trade.pnl.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Showing {filteredTrades.length} of {tradeData.length} trades
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
