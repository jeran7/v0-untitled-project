"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { TradesDataTable } from "@/components/trades/trades-data-table"
import { TradesFilterPanel } from "@/components/trades/trades-filter-panel"
import { TradesSummaryStats } from "@/components/trades/trades-summary-stats"
import { TradesViewToggle } from "@/components/trades/trades-view-toggle"
import { TradesBulkActions } from "@/components/trades/trades-bulk-actions"
import { TradesCalendarView } from "@/components/trades/trades-calendar-view"
import { TradesHeatmapView } from "@/components/trades/trades-heatmap-view"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { TradeFilters, TradeSortField, SortDirection } from "@/hooks/use-trades"
import type { Trade } from "@/hooks/use-trades"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth-service"

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("table")
  const [recentImport, setRecentImport] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState<TradeFilters>({})
  const [selectedTrades, setSelectedTrades] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<TradeSortField>("entry_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Check authentication status - improved to prevent redirect loops
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First try to get userId from localStorage for faster initial render
        try {
          const backup = localStorage.getItem("auth-backup")
          if (backup) {
            const data = JSON.parse(backup)
            if (data.authenticated && data.userId && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
              console.log("Using backup auth from localStorage")
              setUserId(data.userId)
              setAuthChecked(true)
              // Continue with session check in background
            }
          }
        } catch (e) {
          console.error("Could not get backup auth", e)
        }

        // Try to get the session from AuthService
        const session = await AuthService.getSession()

        if (session && session.user) {
          console.log("Found active session")
          setUserId(session.user.id)
          setAuthChecked(true)
          return
        }

        // If no session, try backup auth
        const backupAuth = AuthService.getBackupAuthState()
        if (backupAuth?.authenticated && backupAuth.userId) {
          console.log("Using backup auth state")
          setUserId(backupAuth.userId)
          setAuthChecked(true)
          return
        }

        // If we get here, we have no valid auth
        console.log("No valid authentication found")

        // Only redirect if we haven't already set a userId from backup
        if (!userId) {
          console.log("Redirecting to login")
          router.push("/auth/login?redirect=/trades")
        }
      } catch (err) {
        console.error("Auth check failed:", err)
        // Don't redirect on error, just mark auth as checked
        setAuthChecked(true)
      } finally {
        // Always mark auth as checked to prevent infinite loading
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, [router, userId])

  // Fetch trades when userId is available
  useEffect(() => {
    if (userId) {
      fetchTrades()
    }
  }, [userId])

  const fetchTrades = async () => {
    if (!userId) {
      console.log("No user ID found, waiting for authentication")
      return
    }

    setRefreshing(true)
    try {
      console.log("Fetching trades for user:", userId)
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("entry_date", { ascending: false })

      if (error) {
        console.error("Error fetching trades:", error)
        toast({
          title: "Error",
          description: "Failed to load trades. Please try again.",
          variant: "destructive",
        })
      } else {
        console.log(`Successfully fetched ${data?.length || 0} trades`)
        setTrades(data || [])
      }
    } catch (error) {
      console.error("Error in fetch process:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Check if there was a recent import
    const hasRecentImport = localStorage.getItem("recentImport") === "true"
    const importTimestamp = localStorage.getItem("importTimestamp")

    // Only show the notification if the import was recent (within the last 5 minutes)
    if (hasRecentImport && importTimestamp) {
      const importTime = Number.parseInt(importTimestamp, 10)
      const currentTime = Date.now()
      const fiveMinutesInMs = 5 * 60 * 1000

      if (currentTime - importTime < fiveMinutesInMs) {
        setRecentImport(true)

        // Clear the flag after 1 minute of viewing
        setTimeout(() => {
          localStorage.removeItem("recentImport")
          setRecentImport(false)
        }, 60000)
      } else {
        // Clear old import flags
        localStorage.removeItem("recentImport")
        localStorage.removeItem("importTimestamp")
      }
    }
  }, [])

  const handleRefresh = () => {
    fetchTrades()
  }

  const dismissImportNotification = () => {
    setRecentImport(false)
    localStorage.removeItem("recentImport")
  }

  const handleFilterChange = (newFilters: TradeFilters) => {
    setFilters(newFilters)
    // Apply filters to fetch trades
    console.log("Applying filters:", newFilters)
  }

  const handleFilterPreset = (preset: string) => {
    // Handle filter presets
    console.log("Applying preset:", preset)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when changing page size
  }

  const handleSortChange = (field: TradeSortField) => {
    if (sortBy === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Default to descending for new sort field
      setSortBy(field)
      setSortDirection("desc")
    }
  }

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedTrades(selectedIds)
  }

  // Define a handler function for view changes
  const handleViewChange = (newView: string) => {
    setView(newView)
  }

  // Show loading state while checking auth
  if (!authChecked || (loading && !trades.length)) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your trades...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trades</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {recentImport && (
        <Alert className="bg-green-50 border-green-200">
          <AlertTitle>Import Successful</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>Your trades have been imported successfully.</span>
            <Button variant="outline" size="sm" onClick={dismissImportNotification}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <TradesSummaryStats trades={trades} />

      <div className="flex justify-between items-center">
        <TradesFilterPanel filters={filters} onFilterChange={handleFilterChange} onFilterPreset={handleFilterPreset} />
        <TradesViewToggle activeView={view} onViewChange={handleViewChange} />
      </div>

      <TradesBulkActions selectedTrades={selectedTrades} />

      {view === "table" && (
        <TradesDataTable
          trades={trades}
          isLoading={loading}
          page={page}
          pageSize={pageSize}
          sortBy={sortBy}
          sortDirection={sortDirection}
          totalCount={trades.length}
          selectedTrades={selectedTrades}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortChange={handleSortChange}
          onSelectionChange={handleSelectionChange}
        />
      )}
      {view === "calendar" && <TradesCalendarView trades={trades} />}
      {view === "heatmap" && <TradesHeatmapView trades={trades} />}
    </div>
  )
}
