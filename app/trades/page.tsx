"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format, subDays } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

// Mock data for development
const mockTrades = [
  {
    id: "1",
    created_at: new Date().toISOString(),
    user_id: "user123",
    symbol: "AAPL",
    direction: "Long",
    entry_price: 150.25,
    exit_price: 155.75,
    entry_date: new Date().toISOString(),
    exit_date: new Date().toISOString(),
    quantity: 100,
    pnl: 550,
    status: "Win",
    setup: "Breakout",
    rating: 4,
    commission: 5.99,
    fees: 1.25,
  },
  {
    id: "2",
    created_at: new Date().toISOString(),
    user_id: "user123",
    symbol: "MSFT",
    direction: "Long",
    entry_price: 280.5,
    exit_price: 285.25,
    entry_date: new Date().toISOString(),
    exit_date: new Date().toISOString(),
    quantity: 50,
    pnl: 237.5,
    status: "Win",
    setup: "Pullback",
    rating: 3,
    commission: 5.99,
    fees: 1.25,
  },
  {
    id: "3",
    created_at: new Date().toISOString(),
    user_id: "user123",
    symbol: "TSLA",
    direction: "Short",
    entry_price: 220.75,
    exit_price: 210.25,
    entry_date: new Date().toISOString(),
    exit_date: new Date().toISOString(),
    quantity: 25,
    pnl: 262.5,
    status: "Win",
    setup: "Reversal",
    rating: 5,
    commission: 5.99,
    fees: 1.25,
  },
]

// Helper function to handle Supabase API errors
const handleSupabaseError = (error: any, operation: string): string => {
  // Check if it's a rate limit error
  if (error?.message?.includes("Too Many R")) {
    console.warn(`Rate limit hit during ${operation}. Using mock data.`)
    return "Rate limit exceeded. Please try again later."
  }

  // Log other errors
  console.error(`Error during ${operation}:`, error)
  return `Failed to ${operation}. ${error?.message || "Unknown error"}`
}

export default function TradesPage() {
  const router = useRouter()
  const { user } = useAuth() || { user: null }

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trades, setTrades] = useState<any[]>([])

  // Simple fetch function
  useEffect(() => {
    let isMounted = true

    const fetchTrades = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // Try to fetch from Supabase
        try {
          const { data, error } = await supabase
            .from("trades")
            .select("*")
            .eq("user_id", user.id)
            .order("entry_date", { ascending: false })
            .limit(10)

          if (error) {
            const errorMessage = handleSupabaseError(error, "fetch trades")
            setError(errorMessage)
            // Fall back to mock data
            setTrades(mockTrades)
            return
          }

          if (isMounted) {
            setTrades(data || [])
            setError(null)
          }
        } catch (err: any) {
          console.error("Supabase query error:", err)
          // Fall back to mock data
          if (isMounted) {
            setTrades(mockTrades)
            setError(err.message || "Failed to fetch trades from database")
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError("An unexpected error occurred")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchTrades()

    return () => {
      isMounted = false
    }
  }, [user])

  // Render authentication required state
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6">
        <div className="glass-card p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to view your trades.</p>
          <Button onClick={() => router.push("/auth/login")} className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  // Render loading state
  if (isLoading && trades.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
          <p className="text-muted-foreground">
            {trades.length} trades • {format(subDays(new Date(), 30), "MMM d, yyyy")} -{" "}
            {format(new Date(), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push("/trades/new")} className="gap-2">
            Add New Trade
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}. Using mock data instead.</AlertDescription>
        </Alert>
      )}

      {/* Simple trades list */}
      <div className="glass-card rounded-lg overflow-hidden p-4">
        <div className="grid grid-cols-1 gap-4">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="border rounded-lg p-4 hover:bg-secondary/10 cursor-pointer"
              onClick={() => router.push(`/trades/${trade.id}`)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{trade.symbol}</h3>
                  <p className="text-sm text-muted-foreground">{format(new Date(trade.entry_date), "MMM d, yyyy")}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`font-bold ${trade.pnl > 0 ? "text-green-500" : trade.pnl < 0 ? "text-red-500" : ""}`}
                  >
                    ${trade.pnl?.toFixed(2) || "Open"}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      trade.status === "Win"
                        ? "bg-green-100 text-green-800"
                        : trade.status === "Loss"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {trade.status}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span>
                  {trade.direction} • {trade.quantity} shares
                </span>
                <span>
                  Entry: ${trade.entry_price} • Exit: ${trade.exit_price || "Open"}
                </span>
              </div>
            </div>
          ))}

          {trades.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No trades found. Add your first trade to get started.</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/trades/new")}>
                Add First Trade
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
