"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TransactionReview } from "@/components/import/transaction-review"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { ProcessedTransaction, CompleteTrade, ImportSummary, ImportConfig } from "@/types/import"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export default function TransactionReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const importId = searchParams.get("id")
  const sessionId = searchParams.get("sessionId")

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([])
  const [trades, setTrades] = useState<CompleteTrade[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchImportData() {
      if (!importId) {
        setError("No import ID provided")
        setIsLoading(false)
        return
      }

      try {
        // In a real implementation, this would fetch the import data from your database
        // For now, we'll simulate loading data from localStorage
        const storedData = localStorage.getItem(`import_${importId}`)

        if (!storedData) {
          setError("Import data not found")
          setIsLoading(false)
          return
        }

        const data = JSON.parse(storedData)
        console.log("Retrieved import data:", data)

        // Ensure dates are properly parsed as Date objects
        const processedTransactions = (data.transactions || []).map((t: any) => ({
          ...t,
          activityDate: new Date(t.activityDate),
          processDate: new Date(t.processDate),
          settleDate: new Date(t.settleDate),
          optionDetails: t.optionDetails
            ? {
                ...t.optionDetails,
                expirationDate: new Date(t.optionDetails.expirationDate),
              }
            : undefined,
        }))

        const processedTrades = (data.trades || []).map((t: any) => ({
          ...t,
          entryDate: new Date(t.entryDate),
          exitDate: t.exitDate ? new Date(t.exitDate) : undefined,
          optionDetails: t.optionDetails
            ? {
                ...t.optionDetails,
                expirationDate: new Date(t.optionDetails.expirationDate),
              }
            : undefined,
          transactions: (t.transactions || []).map((tx: any) => ({
            ...tx,
            activityDate: new Date(tx.activityDate),
            processDate: new Date(tx.processDate),
            settleDate: new Date(tx.settleDate),
            optionDetails: tx.optionDetails
              ? {
                  ...tx.optionDetails,
                  expirationDate: new Date(tx.optionDetails.expirationDate),
                }
              : undefined,
          })),
        }))

        setTransactions(processedTransactions)
        setTrades(processedTrades)
        setSummary(data.summary || null)

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching import data:", error)
        setError("Failed to load import data")
        setIsLoading(false)
      }
    }

    fetchImportData()
  }, [importId])

  const handleBack = () => {
    router.push("/import")
  }

  const handleImport = async (config: ImportConfig) => {
    try {
      console.log("Starting import process with config:", config)

      // Get the user ID
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to import trades",
          variant: "destructive",
        })
        return Promise.reject(new Error("Authentication required"))
      }

      const userId = user.id

      // Filter trades based on selection
      const tradesToImport =
        config.selectedTrades.length > 0 ? trades.filter((trade) => config.selectedTrades.includes(trade.id)) : trades

      // Filter transactions based on selection
      const transactionsToImport =
        config.selectedTransactions.length > 0
          ? transactions.filter((tx) => config.selectedTransactions.includes(tx.rowIndex.toString()))
          : transactions

      console.log(`Importing ${tradesToImport.length} trades and ${transactionsToImport.length} transactions`)

      // Start a batch insert for trades
      if (tradesToImport.length > 0) {
        // Prepare trades for database insertion
        const tradesForDb = tradesToImport.map((trade) => ({
          id: trade.id,
          user_id: userId,
          symbol: trade.symbol,
          direction:
            trade.assetType === "option" ? (trade.optionDetails?.optionType === "call" ? "long" : "short") : "long",
          entry_price: trade.entryPrice,
          exit_price: trade.exitPrice || null,
          entry_date: trade.entryDate.toISOString(),
          exit_date: trade.exitDate ? trade.exitDate.toISOString() : null,
          quantity: trade.quantity,
          fees: trade.fees || 0,
          commission: 0, // Default value
          profit_loss: trade.profitLoss,
          profit_loss_percent: trade.profitLossPercent,
          status: trade.status === "open" ? "open" : "closed",
          import_source: "csv",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        // Insert trades into the database
        const { data: insertedTrades, error: tradeError } = await supabase
          .from("trades")
          .upsert(tradesForDb, { onConflict: "id" })
          .select()

        if (tradeError) {
          console.error("Error inserting trades:", tradeError)
          toast({
            title: "Import Error",
            description: `Failed to import trades: ${tradeError.message}`,
            variant: "destructive",
          })
          return Promise.reject(tradeError)
        }

        console.log("Successfully imported trades:", insertedTrades)
      }

      // Save import session to localStorage for reference
      localStorage.setItem(
        "last_import_session",
        JSON.stringify({
          timestamp: new Date().toISOString(),
          trades: tradesToImport.length,
          transactions: transactionsToImport.length,
          summary: summary,
        }),
      )

      // Set success state
      setImportSuccess(true)

      // Show success toast
      toast({
        title: "Import Successful",
        description: `Imported ${tradesToImport.length} trades and ${transactionsToImport.length} transactions`,
        variant: "default",
      })

      // Wait a moment before redirecting
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Redirect to trades page
      router.push("/trades")

      return Promise.resolve()
    } catch (error) {
      console.error("Import failed:", error)
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8 max-w-7xl animate-in">
        <h1 className="text-3xl font-bold mb-6">Transaction Review</h1>
        <Card className="glass-panel">
          <CardContent className="p-8">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="container py-8 max-w-7xl animate-in">
        <h1 className="text-3xl font-bold mb-6">Transaction Review</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Failed to load import data. Please try again."}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push("/import")}>
            Back to Import
          </Button>
        </div>
      </div>
    )
  }

  if (importSuccess) {
    return (
      <div className="container py-8 max-w-7xl animate-in">
        <h1 className="text-3xl font-bold mb-6">Import Successful</h1>
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Your trades have been successfully imported. You will be redirected to the trades page shortly.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/trades")}>View Trades</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Review Imported Transactions</h1>
      <TransactionReview
        transactions={transactions}
        trades={trades}
        summary={summary}
        onBack={handleBack}
        onImport={handleImport}
      />
    </div>
  )
}
