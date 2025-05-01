"use client"

import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"
import type { ImportSummary } from "@/types/import"

interface ImportConfirmationProps {
  summary: ImportSummary | null
  onBack: () => void
  onConfirm: () => void
}

export function ImportConfirmation({ summary, onBack, onConfirm }: ImportConfirmationProps) {
  if (!summary) {
    return (
      <Card className="glass-panel rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl">Import Confirmation</CardTitle>
          <CardDescription>No data available for import</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>No summary data is available. Please go back and try again.</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/30 px-6 py-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="glass-panel rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl">Confirm Import</CardTitle>
        <CardDescription>Review and confirm your import details</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Alert className="bg-primary/10 border-primary/20">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertTitle>Ready to Import</AlertTitle>
          <AlertDescription>
            You're about to import {summary.totalTrades} trades and {summary.completedTrades + summary.openPositions}{" "}
            positions.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Import Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Total Trades</span>
                <span className="font-medium">{summary.totalTrades}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Completed Trades</span>
                <span className="font-medium">{summary.completedTrades}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Open Positions</span>
                <span className="font-medium">{summary.openPositions}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Expired Options</span>
                <span className="font-medium">{summary.expiredOptions}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Performance Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Total P/L</span>
                <span className={`font-medium ${summary.totalProfitLoss >= 0 ? "profit-text" : "loss-text"}`}>
                  {formatCurrency(summary.totalProfitLoss)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Win Rate</span>
                <span className={`font-medium ${summary.winRate >= 0.5 ? "profit-text" : "loss-text"}`}>
                  {(summary.winRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Winning Trades</span>
                <span className="font-medium profit-text">{summary.winCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Losing Trades</span>
                <span className="font-medium loss-text">{summary.lossCount}</span>
              </div>
            </div>
          </div>
        </div>

        <Alert variant="outline" className="bg-muted/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Note</AlertTitle>
          <AlertDescription>
            This action will import all trades and transactions into your trading journal. Duplicate detection will be
            performed to avoid importing the same trades twice.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/30 px-6 py-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        <Button onClick={onConfirm} className="glow-blue pulse-on-hover">
          Confirm Import <ArrowRight size={16} className="ml-2" />
        </Button>
      </CardFooter>
    </Card>
  )
}
