"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Filter,
  Search,
  Edit,
  Trash2,
  Link,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileCheck,
  Calendar,
  BarChart3,
  DollarSign,
  Percent,
  TrendingUp,
  TrendingDown,
  Clock,
  CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Ban,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DateRangePicker } from "@/components/date-range-picker"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency, formatPercent, formatDate } from "@/lib/utils"
import type { ProcessedTransaction, CompleteTrade, ImportSummary } from "@/types/import"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface TransactionReviewProps {
  transactions: ProcessedTransaction[]
  trades: CompleteTrade[]
  summary: ImportSummary
  onBack: () => void
  onImport: (config: ImportConfig) => Promise<void>
}

interface ImportConfig {
  dateRange: { from: Date; to: Date } | undefined
  includeTypes: Record<string, boolean>
  createNewInstruments: boolean
  selectedTransactions: string[]
  selectedTrades: string[]
}

// Format option symbol in a cleaner way
function formatOptionSymbol(
  symbol: string,
  optionDetails?: { strikePrice: number; expirationDate: Date; optionType: "call" | "put" },
) {
  if (!optionDetails) return symbol

  const formattedDate = formatDate(optionDetails.expirationDate, "MMM d")
  const optionTypeIcon =
    optionDetails.optionType === "call" ? (
      <ArrowUpRight className="h-3 w-3 text-blue-500" />
    ) : (
      <ArrowDownRight className="h-3 w-3 text-red-500" />
    )

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-medium">{symbol}</span>
      <span className="text-muted-foreground mx-0.5">$</span>
      <span>{optionDetails.strikePrice.toFixed(0)}</span>
      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/30 text-xs">
        {optionTypeIcon}
        <span className="uppercase font-medium">{optionDetails.optionType}</span>
      </div>
      <span className="text-xs text-muted-foreground">{formattedDate}</span>
    </div>
  )
}

// Format duration with improved display
function formatDuration(entryDate?: Date, exitDate?: Date, status?: string) {
  if (!entryDate || !exitDate) {
    return status === "expired" ? (
      <span className="text-red-400 flex items-center gap-1">
        <Ban className="h-3 w-3" /> Expired
      </span>
    ) : (
      <span className="text-amber-400 flex items-center gap-1">
        <Clock className="h-3 w-3" /> Open
      </span>
    )
  }

  // Calculate days between dates
  const entryTime = new Date(entryDate).getTime()
  const exitTime = new Date(exitDate).getTime()
  const diffTime = Math.abs(exitTime - entryTime)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return (
      <span className="text-purple-400 flex items-center gap-1">
        <Clock className="h-3 w-3" /> Same day
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1">
      <CalendarIcon className="h-3 w-3" /> {diffDays} day{diffDays !== 1 ? "s" : ""}
    </span>
  )
}

// Calculate average exit price for multiple exits and show total costs
function calculateAverageExitPrice(trade: CompleteTrade) {
  if (!trade.exitPrice) return "N/A"

  // If there are multiple STC transactions, calculate weighted average
  const stcTransactions = trade.transactions.filter((t) => t.transCode === "STC")
  if (stcTransactions.length <= 0) return "N/A"

  let totalQuantity = 0
  let weightedSum = 0
  let totalProceeds = 0

  stcTransactions.forEach((t) => {
    totalQuantity += Math.abs(t.quantity)
    weightedSum += Math.abs(t.quantity) * t.price
    totalProceeds += Math.abs(t.amount)
  })

  const avgPrice = weightedSum / totalQuantity

  // For options, we need to show the per-contract price
  const isOption = trade.assetType === "option"
  const displayPrice = isOption ? avgPrice : avgPrice

  return (
    <div>
      <div className="font-medium">{formatCurrency(displayPrice)}</div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {stcTransactions.length > 1 ? `${stcTransactions.length} exits` : ""}
      </div>
      <div className="text-xs text-muted-foreground">Total: {formatCurrency(totalProceeds)}</div>
    </div>
  )
}

// Get entry price and total cost
function getEntryPriceDisplay(trade: CompleteTrade) {
  const btoTransactions = trade.transactions.filter(
    (t) => t.transCode === "BTO" || (t.transCode === "Buy" && t.assetType === "option"),
  )

  if (btoTransactions.length === 0) return formatCurrency(trade.entryPrice)

  // Calculate total cost from BTO transactions
  let totalCost = 0
  btoTransactions.forEach((t) => {
    totalCost += Math.abs(t.amount)
  })

  // For options, we need to show the per-contract price
  const isOption = trade.assetType === "option"
  const displayPrice = isOption ? trade.entryPrice : trade.entryPrice

  return (
    <div>
      <div className="font-medium">{formatCurrency(displayPrice)}</div>
      <div className="text-xs text-muted-foreground">Total: {formatCurrency(totalCost)}</div>
    </div>
  )
}

export function TransactionReview({ transactions, trades, summary, onBack, onImport }: TransactionReviewProps) {
  const [activeTab, setActiveTab] = useState("options")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined)
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [selectedTrades, setSelectedTrades] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importSuccess, setImportSuccess] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [includeTypes, setIncludeTypes] = useState({
    options: true,
    stocks: true,
    dividends: true,
    transfers: false,
    fees: false,
  })
  const [createNewInstruments, setCreateNewInstruments] = useState(true)
  const [expandedTrades, setExpandedTrades] = useState<string[]>([])
  const [debugMode, setDebugMode] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error checking auth:", error)
          toast({
            title: "Authentication Error",
            description: "Please log in to continue.",
            variant: "destructive",
          })
          router.push("/auth/login?redirect=/import/review")
          return
        }

        if (!session || !session.user) {
          console.log("No active session found, redirecting to login")
          toast({
            title: "Authentication Required",
            description: "You must be logged in to import trades.",
            variant: "destructive",
          })
          router.push("/auth/login?redirect=/import/review")
          return
        }

        setUserId(session.user.id)
      } catch (err) {
        console.error("Auth check failed:", err)
        router.push("/auth/login?redirect=/import/review")
      }
    }

    checkAuth()
  }, [supabase, router])

  // Debug logging
  useEffect(() => {
    console.log("TransactionReview component mounted")
    console.log("Trades data:", trades)
    console.log("Transactions data:", transactions)
    console.log("Summary data:", summary)
    console.log("User ID:", userId)

    // Check if data is available
    if (!trades || trades.length === 0) {
      console.warn("No trades data available")
    }
    if (!transactions || transactions.length === 0) {
      console.warn("No transactions data available")
    }
  }, [trades, transactions, summary, userId])

  // Filter transactions by type based on active tab
  const filteredTransactions = useMemo(() => {
    console.log("Filtering transactions for tab:", activeTab)
    let filtered = [...transactions]

    // Apply date range filter if set
    if (dateRange) {
      filtered = filtered.filter(
        (transaction) => transaction.activityDate >= dateRange.from && transaction.activityDate <= dateRange.to,
      )
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by transaction type based on active tab
    switch (activeTab) {
      case "options":
        return filtered.filter(
          (transaction) => transaction.assetType === "option" && ["BTO", "STC", "OEXP"].includes(transaction.transCode),
        )
      case "stocks":
        return filtered.filter(
          (transaction) => transaction.assetType === "stock" && ["Buy", "Sell"].includes(transaction.transCode),
        )
      case "dividends":
        return filtered.filter(
          (transaction) =>
            transaction.transCode === "CDIV" || transaction.description?.toLowerCase().includes("dividend"),
        )
      case "transfers":
        return filtered.filter(
          (transaction) =>
            transaction.transCode === "ACH" ||
            transaction.description?.toLowerCase().includes("transfer") ||
            transaction.description?.toLowerCase().includes("deposit") ||
            transaction.description?.toLowerCase().includes("withdrawal"),
        )
      case "fees":
        return filtered.filter(
          (transaction) =>
            transaction.transCode === "AFEE" ||
            transaction.description?.toLowerCase().includes("fee") ||
            transaction.description?.toLowerCase().includes("commission"),
        )
      default:
        return filtered
    }
  }, [transactions, activeTab, searchTerm, dateRange])

  // Filter trades based on active tab, search term, and date range
  const filteredTrades = useMemo(() => {
    console.log("Filtering trades for tab:", activeTab)
    console.log("Current trades data:", trades)

    let filtered = [...trades]

    // Apply date range filter if set
    if (dateRange) {
      filtered = filtered.filter(
        (trade) => trade.entryDate >= dateRange.from && (!trade.exitDate || trade.exitDate <= dateRange.to),
      )
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((trade) => trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Filter by asset type based on active tab
    switch (activeTab) {
      case "options":
        return filtered.filter((trade) => trade.assetType === "option")
      case "stocks":
        return filtered.filter((trade) => trade.assetType === "stock")
      default:
        return filtered
    }
  }, [trades, activeTab, searchTerm, dateRange])

  // Sort transactions or trades
  const sortedData = useMemo(() => {
    if (!sortConfig) return activeTab === "options" || activeTab === "stocks" ? filteredTrades : filteredTransactions

    const sorted = [...(activeTab === "options" || activeTab === "stocks" ? filteredTrades : filteredTransactions)]

    sorted.sort((a, b) => {
      if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [filteredTransactions, filteredTrades, activeTab, sortConfig])

  // Handle sort request
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Toggle transaction selection
  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactions((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  // Toggle trade selection
  const toggleTradeSelection = (id: string) => {
    setSelectedTrades((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  // Toggle trade expansion to show related transactions
  const toggleTradeExpansion = (id: string) => {
    // If this trade is already expanded, collapse it
    if (expandedTrades.includes(id)) {
      setExpandedTrades((prev) => prev.filter((item) => item !== id))
    }
    // Otherwise, collapse any other expanded trades and expand this one
    else {
      setExpandedTrades([id])
    }
  }

  // Select all visible transactions
  const selectAllTransactions = (select: boolean) => {
    if (select) {
      const ids = filteredTransactions.map((transaction) => transaction.rowIndex.toString())
      setSelectedTransactions(ids)
    } else {
      setSelectedTransactions([])
    }
  }

  // Select all visible trades
  const selectAllTrades = (select: boolean) => {
    if (select) {
      const ids = filteredTrades.map((trade) => trade.id)
      setSelectedTrades(ids)
    } else {
      setSelectedTrades([])
    }
  }

  // Handle import button click
  const handleImport = async () => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to import trades. Please log in and try again.",
        variant: "destructive",
      })
      router.push("/auth/login?redirect=/import/review")
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + 5
      })
    }, 100)

    try {
      // Filter trades based on selection
      const tradesToImport =
        selectedTrades.length > 0 ? trades.filter((trade) => selectedTrades.includes(trade.id)) : trades

      // Prepare trades for database insertion
      const tradesForDb = tradesToImport.map((trade) => ({
        symbol: trade.symbol,
        direction:
          trade.assetType === "option" ? (trade.optionDetails?.optionType === "call" ? "Long" : "Short") : "Long",
        entry_price: trade.entryPrice,
        exit_price: trade.exitPrice || null,
        entry_date: trade.entryDate.toISOString(),
        exit_date: trade.exitDate ? trade.exitDate.toISOString() : null,
        quantity: trade.quantity,
        fees: trade.fees || 0,
        commission: 0, // Default value
        profit_loss: trade.profitLoss,
        status: trade.status === "open" ? "Open" : trade.profitLoss > 0 ? "Win" : "Loss",
        import_source: "csv",
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      // Insert trades into the database
      if (tradesForDb.length > 0) {
        const { error: tradeError } = await supabase.from("trades").upsert(tradesForDb)

        if (tradeError) {
          console.error("Error inserting trades:", tradeError)
          toast({
            title: "Import Error",
            description: `Failed to import trades: ${tradeError.message}`,
            variant: "destructive",
          })
          clearInterval(progressInterval)
          setIsImporting(false)
          return
        }
      }

      // Save import session to localStorage for reference
      localStorage.setItem(
        "last_import_session",
        JSON.stringify({
          timestamp: new Date().toISOString(),
          trades: tradesToImport.length,
          transactions: selectedTransactions.length,
          summary: summary,
        }),
      )

      // Set success state
      clearInterval(progressInterval)
      setImportProgress(100)
      setImportSuccess(true)

      // Show success toast
      toast({
        title: "Import Successful",
        description: `Imported ${tradesToImport.length} trades`,
      })

      // Set recentImport flag in localStorage
      localStorage.setItem("recentImport", "true")
      localStorage.setItem("importTimestamp", Date.now().toString())

      // Wait a moment before redirecting
      setTimeout(() => {
        router.push("/trades")
      }, 2000)
    } catch (error: any) {
      console.error("Import failed:", error)
      toast({
        title: "Import Failed",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      })
      clearInterval(progressInterval)
      setImportProgress(0)
      setIsImporting(false)
    }
  }

  // Check for potential issues in the data
  useEffect(() => {
    const newWarnings: string[] = []

    // Check for options without matching transactions
    const unmatchedOptions = trades.filter((trade) => trade.assetType === "option" && trade.transactions.length === 1)
    if (unmatchedOptions.length > 0) {
      newWarnings.push(`Found ${unmatchedOptions.length} option trades with unmatched transactions.`)
    }

    // Check for expired options
    const expiredOptions = trades.filter((trade) => trade.status === "expired")
    if (expiredOptions.length > 0) {
      newWarnings.push(`Found ${expiredOptions.length} expired options.`)
    }

    // Check for open positions
    const openPositions = trades.filter((trade) => trade.status === "open")
    if (openPositions.length > 0) {
      newWarnings.push(`Found ${openPositions.length} open positions.`)
    }

    setWarnings(newWarnings)
  }, [trades])

  // Define columns for options and stocks trades
  const tradeColumns = [
    {
      id: "selection",
      header: ({ table }: any) => (
        <Checkbox
          checked={
            table.getFilteredRowModel().rows.length > 0 &&
            table.getFilteredRowModel().rows.every((row: any) => selectedTrades.includes(row.original.id))
          }
          onCheckedChange={(value) => selectAllTrades(!!value)}
          aria-label="Select all"
          className="glass-input"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={selectedTrades.includes(row.original.id)}
          onCheckedChange={() => toggleTradeSelection(row.original.id)}
          aria-label="Select row"
          className="glass-input"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "symbol",
      header: "Symbol",
      cell: ({ row }: any) => {
        const trade = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6 hover:bg-muted/30 transition-colors"
              onClick={() => toggleTradeExpansion(trade.id)}
            >
              {expandedTrades.includes(trade.id) ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {formatOptionSymbol(trade.symbol, trade.optionDetails)}
          </div>
        )
      },
    },
    {
      id: "entryInfo",
      header: "Entry",
      cell: ({ row }: any) => {
        const trade = row.original
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
              <span>{formatDate(trade.entryDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              {getEntryPriceDisplay(trade)}
            </div>
          </div>
        )
      },
    },
    {
      id: "exitInfo",
      header: "Exit",
      cell: ({ row }: any) => {
        const trade = row.original
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
              <span>{trade.exitDate ? formatDate(trade.exitDate) : "Open"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              {calculateAverageExitPrice(trade)}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }: any) => formatDuration(row.original.entryDate, row.original.exitDate, row.original.status),
    },
    {
      accessorKey: "quantity",
      header: () => (
        <div className="flex items-center justify-end cursor-pointer" onClick={() => requestSort("quantity")}>
          <span>Quantity</span>
          {sortConfig?.key === "quantity" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => (
        <div className="text-right">
          {Math.abs(row.original.quantity).toFixed(row.original.quantity % 1 === 0 ? 0 : 4)}
        </div>
      ),
    },
    {
      accessorKey: "profitLoss",
      header: () => (
        <div className="flex items-center justify-end cursor-pointer" onClick={() => requestSort("profitLoss")}>
          <span>P&L</span>
          {sortConfig?.key === "profitLoss" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => {
        const pl = row.original.profitLoss
        return (
          <div className="text-right font-medium">
            <div className={pl > 0 ? "text-blue-500" : pl < 0 ? "text-red-500" : ""}>{formatCurrency(pl)}</div>
            <div className={`text-xs ${pl > 0 ? "text-blue-400" : pl < 0 ? "text-red-400" : "text-muted-foreground"}`}>
              {formatPercent(row.original.profitLossPercent)}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.original.status
        const statusConfig = {
          open: { variant: "outline", icon: <Clock className="h-3.5 w-3.5 mr-1" />, label: "Open" },
          closed: {
            variant: row.original.profitLoss > 0 ? "success" : "destructive",
            icon:
              row.original.profitLoss > 0 ? (
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 mr-1" />
              ),
            label: "Closed",
          },
          expired: { variant: "destructive", icon: <Ban className="h-3.5 w-3.5 mr-1" />, label: "Expired" },
        }

        const config = statusConfig[status as keyof typeof statusConfig]

        return (
          <Badge variant={config.variant as any} className="flex items-center justify-center px-2 py-1">
            {config.icon}
            {config.label}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/30 transition-colors">
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit trade</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/30 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove trade</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/30 transition-colors">
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Link to trade</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ]

  // Define columns for transactions (dividends, transfers, fees)
  const transactionColumns = [
    {
      id: "selection",
      header: ({ table }: any) => (
        <Checkbox
          checked={
            table.getFilteredRowModel().rows.length > 0 &&
            table
              .getFilteredRowModel()
              .rows.every((row: any) => selectedTransactions.includes(row.original.rowIndex.toString()))
          }
          onCheckedChange={(value) => selectAllTransactions(!!value)}
          aria-label="Select all"
          className="glass-input"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={selectedTransactions.includes(row.original.rowIndex.toString())}
          onCheckedChange={() => toggleTransactionSelection(row.original.rowIndex.toString())}
          aria-label="Select row"
          className="glass-input"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "activityDate",
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => requestSort("activityDate")}>
          <span>Date</span>
          {sortConfig?.key === "activityDate" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => formatDate(row.original.activityDate),
    },
    {
      accessorKey: "symbol",
      header: "Symbol",
      cell: ({ row }: any) => row.original.symbol || "N/A",
    },
    {
      accessorKey: "transCode",
      header: "Type",
      cell: ({ row }: any) => (
        <Badge variant={getTransactionBadgeVariant(row.original.transCode)}>{row.original.transCode}</Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }: any) => (
        <div className="max-w-xs truncate" title={row.original.description}>
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="flex items-center justify-end cursor-pointer" onClick={() => requestSort("amount")}>
          <span>Amount</span>
          {sortConfig?.key === "amount" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => (
        <div className="text-right">
          <span className={row.original.amount >= 0 ? "text-blue-500" : "text-red-500"}>
            {formatCurrency(row.original.amount)}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/30 transition-colors">
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit transaction</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/30 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove transaction</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/30 transition-colors">
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Link to trade</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ]

  // Render expanded trade details
  const renderExpandedTradeDetails = (tradeId: string) => {
    const trade = trades.find((t) => t.id === tradeId)
    if (!trade) return null

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-muted/30 backdrop-blur-sm p-4 rounded-md mt-2 mb-4 border border-border/50"
      >
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Link className="h-4 w-4 text-blue-400" />
          Related Transactions
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-2 text-muted-foreground">Date</th>
                <th className="text-left py-2 px-2 text-muted-foreground">Type</th>
                <th className="text-left py-2 px-2 text-muted-foreground">Description</th>
                <th className="text-right py-2 px-2 text-muted-foreground">Quantity</th>
                <th className="text-right py-2 px-2 text-muted-foreground">Price</th>
                <th className="text-right py-2 px-2 text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {trade.transactions.map((transaction, index) => (
                <tr key={index} className="border-b border-border/30 hover:bg-muted/50 transition-colors">
                  <td className="py-2 px-2">{formatDate(transaction.activityDate)}</td>
                  <td className="py-2 px-2">
                    <Badge variant={getTransactionBadgeVariant(transaction.transCode)} className="text-xs">
                      {transaction.transCode}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 max-w-xs truncate" title={transaction.description}>
                    {transaction.description}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {Math.abs(transaction.quantity).toFixed(transaction.quantity % 1 === 0 ? 0 : 4)}
                  </td>
                  <td className="py-2 px-2 text-right">{formatCurrency(transaction.price)}</td>
                  <td className="py-2 px-2 text-right">
                    <span className={transaction.amount >= 0 ? "text-blue-500" : "text-red-500"}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    )
  }

  // Add this function to debug option price calculations
  function debugOptionPrices(trade: CompleteTrade) {
    if (trade.assetType !== "option") return

    console.log("Option Trade:", trade.symbol, trade.optionDetails)

    const btoTransactions = trade.transactions.filter(
      (t) => t.transCode === "BTO" || (t.transCode === "Buy" && t.description?.toLowerCase().includes("option")),
    )

    const stcTransactions = trade.transactions.filter(
      (t) => t.transCode === "STC" || (t.transCode === "Sell" && t.description?.toLowerCase().includes("option")),
    )

    console.log("BTO Transactions:", btoTransactions)
    console.log("STC Transactions:", stcTransactions)

    // Calculate entry price
    if (btoTransactions.length > 0) {
      const totalQuantity = btoTransactions.reduce((sum, t) => sum + Math.abs(t.quantity), 0)
      const totalCost = btoTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const perContractPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0

      console.log("Entry Calculation:")
      console.log("- Total Quantity:", totalQuantity)
      console.log("- Total Cost:", totalCost)
      console.log("- Per Contract Price:", perContractPrice)
    }

    // Calculate exit price
    if (stcTransactions.length > 0) {
      const totalQuantity = stcTransactions.reduce((sum, t) => sum + Math.abs(t.quantity), 0)
      const totalProceeds = stcTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const perContractPrice = totalQuantity > 0 ? totalProceeds / totalQuantity : 0

      console.log("Exit Calculation:")
      console.log("- Total Quantity:", totalQuantity)
      console.log("- Total Proceeds:", totalProceeds)
      console.log("- Per Contract Price:", perContractPrice)
    }
  }

  // Add this useEffect hook after the other useEffect hooks
  useEffect(() => {
    // Debug option prices for the problematic SPY trade
    const spyTrades = trades.filter(
      (t) => t.symbol === "SPY" && t.assetType === "option" && t.optionDetails?.strikePrice === 548,
    )

    if (spyTrades.length > 0) {
      console.log("Found SPY $548 trades:", spyTrades.length)
      spyTrades.forEach(debugOptionPrices)
    }
  }, [trades])

  // Show loading state if checking authentication
  if (!userId) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="glass-panel rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl">Transaction Review</CardTitle>
        <CardDescription>Review and refine your transactions before importing</CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {warnings.length > 0 && (
          <Alert variant="warning" className="mb-6 glass-panel border-amber-500/30">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Attention Required</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 glass-input"
              />
            </div>

            <DateRangePicker value={dateRange} onChange={setDateRange} className="w-full sm:w-auto" />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-[150px] glass-input">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="options">Options Trades</SelectItem>
                <SelectItem value="stocks">Stock Trades</SelectItem>
                <SelectItem value="dividends">Dividends & Income</SelectItem>
                <SelectItem value="transfers">Transfers</SelectItem>
                <SelectItem value="fees">Fees</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="glass-input">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="options" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Options
            </TabsTrigger>
            <TabsTrigger value="stocks" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Stocks
            </TabsTrigger>
            <TabsTrigger value="dividends" className="flex items-center gap-1">
              <Percent className="h-4 w-4" />
              Dividends
            </TabsTrigger>
            <TabsTrigger value="transfers" className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Transfers
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center gap-1">
              <FileCheck className="h-4 w-4" />
              Fees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="space-y-4">
            <div className="rounded-md overflow-hidden border border-border/40 backdrop-blur-md">
              <DataTable
                columns={tradeColumns}
                data={filteredTrades.filter((trade) => trade.assetType === "option")}
                pagination={true}
              />
            </div>
            {expandedTrades.map((tradeId) => renderExpandedTradeDetails(tradeId))}
          </TabsContent>

          <TabsContent value="stocks" className="space-y-4">
            <div className="rounded-md overflow-hidden border border-border/40 backdrop-blur-md">
              <DataTable
                columns={tradeColumns}
                data={filteredTrades.filter((trade) => trade.assetType === "stock")}
                pagination={true}
              />
            </div>
            {expandedTrades.map((tradeId) => renderExpandedTradeDetails(tradeId))}
          </TabsContent>

          <TabsContent value="dividends" className="space-y-4">
            <div className="rounded-md overflow-hidden border border-border/40 backdrop-blur-md">
              <DataTable
                columns={transactionColumns}
                data={filteredTransactions.filter(
                  (transaction) =>
                    transaction.transCode === "CDIV" || transaction.description?.toLowerCase().includes("dividend"),
                )}
                pagination={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="transfers" className="space-y-4">
            <div className="rounded-md overflow-hidden border border-border/40 backdrop-blur-md">
              <DataTable
                columns={transactionColumns}
                data={filteredTransactions.filter(
                  (transaction) =>
                    transaction.transCode === "ACH" ||
                    transaction.description?.toLowerCase().includes("transfer") ||
                    transaction.description?.toLowerCase().includes("deposit") ||
                    transaction.description?.toLowerCase().includes("withdrawal"),
                )}
                pagination={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="fees" className="space-y-4">
            <div className="rounded-md overflow-hidden border border-border/40 backdrop-blur-md">
              <DataTable
                columns={transactionColumns}
                data={filteredTransactions.filter(
                  (transaction) =>
                    transaction.transCode === "AFEE" ||
                    transaction.description?.toLowerCase().includes("fee") ||
                    transaction.description?.toLowerCase().includes("commission"),
                )}
                pagination={true}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-panel backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Import Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Include Transaction Types</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="options"
                          checked={includeTypes.options}
                          onCheckedChange={(checked) => setIncludeTypes({ ...includeTypes, options: !!checked })}
                          className="glass-input"
                        />
                        <label htmlFor="options" className="text-sm">
                          Options Trades
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="stocks"
                          checked={includeTypes.stocks}
                          onCheckedChange={(checked) => setIncludeTypes({ ...includeTypes, stocks: !!checked })}
                          className="glass-input"
                        />
                        <label htmlFor="stocks" className="text-sm">
                          Stock Trades
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="dividends"
                          checked={includeTypes.dividends}
                          onCheckedChange={(checked) => setIncludeTypes({ ...includeTypes, dividends: !!checked })}
                          className="glass-input"
                        />
                        <label htmlFor="dividends" className="text-sm">
                          Dividends & Income
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="transfers"
                          checked={includeTypes.transfers}
                          onCheckedChange={(checked) => setIncludeTypes({ ...includeTypes, transfers: !!checked })}
                          className="glass-input"
                        />
                        <label htmlFor="transfers" className="text-sm">
                          Transfers
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="fees"
                          checked={includeTypes.fees}
                          onCheckedChange={(checked) => setIncludeTypes({ ...includeTypes, fees: !!checked })}
                          className="glass-input"
                        />
                        <label htmlFor="fees" className="text-sm">
                          Fees
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Instrument Handling</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createNew"
                        checked={createNewInstruments}
                        onCheckedChange={(checked) => setCreateNewInstruments(!!checked)}
                        className="glass-input"
                      />
                      <label htmlFor="createNew" className="text-sm">
                        Create new instruments if not found
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Trade Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Trades</span>
                    <span className="font-medium">{summary.totalTrades}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className={`font-medium ${summary.winRate >= 0.5 ? "text-blue-500" : "text-red-500"}`}>
                      {(summary.winRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total P&L</span>
                    <span className={`font-medium ${summary.totalProfitLoss >= 0 ? "text-blue-500" : "text-red-500"}`}>
                      {formatCurrency(summary.totalProfitLoss)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Win</span>
                    <span className="font-medium text-blue-500">{formatCurrency(summary.averageWin)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Loss</span>
                    <span className="font-medium text-red-500">{formatCurrency(summary.averageLoss)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  Selection Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Selected Trades</span>
                    <span className="font-medium">{selectedTrades.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Selected Transactions</span>
                    <span className="font-medium">{selectedTransactions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Date Range</span>
                    <span className="font-medium">
                      {dateRange ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}` : "All Dates"}
                    </span>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full glass-button"
                      onClick={() => {
                        setSelectedTrades([])
                        setSelectedTransactions([])
                        setDateRange(undefined)
                      }}
                    >
                      Reset Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between bg-muted/30 backdrop-blur-md px-6 py-4">
        <Button variant="outline" onClick={onBack} className="glass-button">
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>

        <div className="flex items-center gap-4">
          {isImporting && (
            <div className="flex items-center gap-2 w-48">
              <Progress value={importProgress} className="h-2" />
              <span className="text-xs text-muted-foreground">{Math.round(importProgress)}%</span>
            </div>
          )}

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleImport}
              disabled={isImporting || (selectedTrades.length === 0 && selectedTransactions.length === 0)}
              className={`relative glass-button ${importSuccess ? "bg-green-600/70 hover:bg-green-700/70 border-green-500/50" : ""}`}
            >
              {importSuccess ? (
                <>
                  <CheckCircle size={16} className="mr-2" /> Import Complete
                </>
              ) : (
                <>
                  {isImporting ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" /> Importing...
                    </>
                  ) : (
                    <>
                      <FileCheck size={16} className="mr-2" /> Import Selected
                    </>
                  )}
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </CardFooter>
    </Card>
  )
}

function getTransactionBadgeVariant(
  transCode: string,
): "default" | "secondary" | "outline" | "destructive" | "success" {
  switch (transCode) {
    case "Buy":
    case "BTO":
      return "default"
    case "Sell":
    case "STC":
      return "secondary"
    case "CDIV":
      return "success"
    case "AFEE":
      return "destructive"
    case "OEXP":
      return "destructive"
    case "ACH":
      return "outline"
    default:
      return "outline"
  }
}
