"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TransactionReview } from "@/components/import/transaction-review"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { ProcessedTransaction, CompleteTrade, ImportSummary, ImportConfig } from "@/types/import"
import { Button } from "@/components/ui/button"

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
      // In a real implementation, this would send the import configuration to your server
      // and process the import
      console.log("Import configuration:", config)

      // Simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirect to trades page after successful import
      router.push("/trades")

      return Promise.resolve()
    } catch (error) {
      console.error("Import failed:", error)
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
      </div>
    )
  }

  const handleFinishImport = async () => {
    router.push("/trades")
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
        sessionId={sessionId}
      />
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => router.push("/import")}>
          Back to Import
        </Button>
        <Button onClick={handleFinishImport}>Finish Import</Button>
      </div>
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 border border-gray-700 rounded-md">
          <h3 className="text-lg font-medium mb-2">Debug Information</h3>
          <p>Session ID: {sessionId || "Not provided"}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => console.log("Current session data:", sessionId)}
            className="mt-2"
          >
            Log Session Data
          </Button>
        </div>
      )}
    </div>
  )
}
