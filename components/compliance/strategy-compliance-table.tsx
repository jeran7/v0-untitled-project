"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ComplianceData } from "@/hooks/use-compliance-data"

interface StrategyComplianceTableProps {
  data: ComplianceData | null
  isLoading: boolean
}

type SortField = "strategyName" | "compliance" | "totalTrades" | "winRate"
type SortDirection = "asc" | "desc"

export function StrategyComplianceTable({ data, isLoading }: StrategyComplianceTableProps) {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("compliance")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Strategy Compliance</CardTitle>
          <CardDescription>Detailed compliance metrics for each strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.complianceByStrategy.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Strategy Compliance</CardTitle>
          <CardDescription>Detailed compliance metrics for each strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No strategy compliance data available</p>
        </CardContent>
      </Card>
    )
  }

  // Add win rate data to strategies (mock data for now)
  // In a real implementation, this would come from the API
  const strategiesWithWinRate = data.complianceByStrategy.map((strategy) => ({
    ...strategy,
    winRate: Math.random() * 0.7 + 0.3, // Random win rate between 30% and 100%
  }))

  // Sort the strategies
  const sortedStrategies = [...strategiesWithWinRate].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case "strategyName":
        comparison = a.strategyName.localeCompare(b.strategyName)
        break
      case "compliance":
        comparison = a.compliance - b.compliance
        break
      case "totalTrades":
        comparison = a.totalTrades - b.totalTrades
        break
      case "winRate":
        comparison = a.winRate - b.winRate
        break
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null

    return sortDirection === "asc" ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Strategy Compliance</CardTitle>
        <CardDescription>Detailed compliance metrics for each strategy</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                    onClick={() => handleSort("strategyName")}
                  >
                    Strategy Name {getSortIcon("strategyName")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                    onClick={() => handleSort("totalTrades")}
                  >
                    Times Used {getSortIcon("totalTrades")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                    onClick={() => handleSort("compliance")}
                  >
                    Avg. Compliance % {getSortIcon("compliance")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                    onClick={() => handleSort("winRate")}
                  >
                    Win Rate {getSortIcon("winRate")}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStrategies.map((strategy) => (
                <>
                  <TableRow
                    key={strategy.strategyId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      setExpandedStrategy(expandedStrategy === strategy.strategyId ? null : strategy.strategyId)
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {expandedStrategy === strategy.strategyId ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronUpIcon className="h-4 w-4" />
                        )}
                        {strategy.strategyName}
                      </div>
                    </TableCell>
                    <TableCell>{strategy.totalTrades}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={strategy.compliance * 100}
                          className="w-24 h-2"
                          indicatorClassName={
                            strategy.compliance > 0.8
                              ? "bg-green-500"
                              : strategy.compliance > 0.5
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }
                        />
                        <span>{(strategy.compliance * 100).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={strategy.winRate > 0.5 ? "success" : "destructive"}>
                        {(strategy.winRate * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>

                  {expandedStrategy === strategy.strategyId && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={4} className="p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Strategy Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Compliant Trades</p>
                                <p className="font-medium">
                                  {strategy.compliantTrades} of {strategy.totalTrades}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                                <p className="font-medium">{(strategy.compliance * 100).toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Win Rate</p>
                                <p className="font-medium">{(strategy.winRate * 100).toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Profit Factor</p>
                                <p className="font-medium">1.8</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Compliance Impact</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Win Rate (Compliant Trades)</p>
                                <p className="font-medium text-green-500">
                                  {((strategy.winRate + 0.15) * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Win Rate (Non-Compliant Trades)</p>
                                <p className="font-medium text-red-500">
                                  {((strategy.winRate - 0.25) * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button variant="outline" size="sm">
                              View Full Analysis
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
