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

export default function TransactionReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const importId = searchParams.get("id")

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
        setTransactions(data.transactions || [])
        setTrades(data.trades || [])
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

  return (
    <div className="container py-8 max-w-7xl animate-in">
      <h1 className="text-3xl font-bold mb-6">Transaction Review</h1>
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
