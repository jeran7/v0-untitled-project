"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Filter,
  Search,
  Edit,
  Trash2,
  Link,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileCheck,
  Calendar,
  BarChart3,
  DollarSign,
  Percent,
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

  // Filter transactions by type based on active tab
  const filteredTransactions = useMemo(() => {
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
          transaction.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()),
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
            transaction.transCode === "CDIV" || transaction.description.toLowerCase().includes("dividend"),
        )
      case "transfers":
        return filtered.filter(
          (transaction) =>
            transaction.transCode === "ACH" ||
            transaction.description.toLowerCase().includes("transfer") ||
            transaction.description.toLowerCase().includes("deposit") ||
            transaction.description.toLowerCase().includes("withdrawal"),
        )
      case "fees":
        return filtered.filter(
          (transaction) =>
            transaction.transCode === "AFEE" ||
            transaction.description.toLowerCase().includes("fee") ||
            transaction.description.toLowerCase().includes("commission"),
        )
      default:
        return filtered
    }
  }, [transactions, activeTab, searchTerm, dateRange])

  // Filter trades based on active tab, search term, and date range
  const filteredTrades = useMemo(() => {
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
    setExpandedTrades((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
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
      // Prepare import configuration
      const importConfig: ImportConfig = {
        dateRange,
        includeTypes,
        createNewInstruments,
        selectedTransactions,
        selectedTrades,
      }

      // Call the import function
      await onImport(importConfig)

      // Complete the progress
      clearInterval(progressInterval)
      setImportProgress(100)
      setImportSuccess(true)

      // Reset after a delay
      setTimeout(() => {
        setIsImporting(false)
        setImportProgress(0)
      }, 2000)
    } catch (error) {
      console.error("Import failed:", error)
      clearInterval(progressInterval)
      setImportProgress(0)
      setIsImporting(false)
      // Handle error
    }
  }

  // Check for potential issues in the data
  useMemo(() => {
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
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={selectedTrades.includes(row.original.id)}
          onCheckedChange={() => toggleTradeSelection(row.original.id)}
          aria-label="Select row"
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
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-0 h-6 w-6" onClick={() => toggleTradeExpansion(trade.id)}>
              {expandedTrades.includes(trade.id) ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <span className="font-medium">{trade.symbol}</span>
            {trade.assetType === "option" && trade.optionDetails && (
              <Badge variant="outline" className="text-xs">
                {trade.optionDetails.optionType.toUpperCase()} ${trade.optionDetails.strikePrice.toFixed(2)} exp{" "}
                {formatDate(trade.optionDetails.expirationDate, "MM/dd/yy")}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "entryDate",
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => requestSort("entryDate")}>
          <span>Entry Date</span>
          {sortConfig?.key === "entryDate" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => formatDate(row.original.entryDate),
    },
    {
      accessorKey: "exitDate",
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => requestSort("exitDate")}>
          <span>Exit Date</span>
          {sortConfig?.key === "exitDate" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => (row.original.exitDate ? formatDate(row.original.exitDate) : "Open"),
    },
    {
      accessorKey: "duration",
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => requestSort("duration")}>
          <span>Duration</span>
          {sortConfig?.key === "duration" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => (row.original.duration ? `${row.original.duration} days` : "N/A"),
    },
    {
      accessorKey: "quantity",
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => requestSort("quantity")}>
          <span>Quantity</span>
          {sortConfig?.key === "quantity" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => Math.abs(row.original.quantity).toFixed(row.original.quantity % 1 === 0 ? 0 : 4),
    },
    {
      accessorKey: "entryPrice",
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => requestSort("entryPrice")}>
          <span>Entry Price</span>
          {sortConfig?.key === "entryPrice" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => formatCurrency(row.original.entryPrice),
    },
    {
      accessorKey: "exitPrice",
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => requestSort("exitPrice")}>
          <span>Exit Price</span>
          {sortConfig?.key === "exitPrice" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => (row.original.exitPrice ? formatCurrency(row.original.exitPrice) : "N/A"),
    },
    {
      accessorKey: "profitLoss",
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => requestSort("profitLoss")}>
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
        return <span className={pl > 0 ? "text-blue-500" : pl < 0 ? "text-red-500" : ""}>{formatCurrency(pl)}</span>
      },
    },
    {
      accessorKey: "profitLossPercent",
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => requestSort("profitLossPercent")}>
          <span>P&L %</span>
          {sortConfig?.key === "profitLossPercent" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => {
        const plPercent = row.original.profitLossPercent
        return (
          <span className={plPercent > 0 ? "text-blue-500" : plPercent < 0 ? "text-red-500" : ""}>
            {formatPercent(plPercent)}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.original.status
        return (
          <Badge variant={status === "open" ? "outline" : status === "closed" ? "success" : "destructive"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit trade</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove trade</TooltipContent>
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
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={selectedTransactions.includes(row.original.rowIndex.toString())}
          onCheckedChange={() => toggleTransactionSelection(row.original.rowIndex.toString())}
          aria-label="Select row"
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
        <div className="flex items-center cursor-pointer" onClick={() => requestSort("amount")}>
          <span>Amount</span>
          {sortConfig?.key === "amount" && (
            <span className="ml-1">
              {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      ),
      cell: ({ row }: any) => (
        <span className={row.original.amount >= 0 ? "text-blue-500" : "text-red-500"}>
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit transaction</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove transaction</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
      <div className="bg-muted/30 p-4 rounded-md mt-2 mb-4 border border-border/50">
        <h4 className="text-sm font-medium mb-2">Related Transactions</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Description</th>
                <th className="text-left py-2 px-2">Quantity</th>
                <th className="text-left py-2 px-2">Price</th>
                <th className="text-left py-2 px-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {trade.transactions.map((transaction, index) => (
                <tr key={index} className="border-b border-border/30 hover:bg-muted/50">
                  <td className="py-2 px-2">{formatDate(transaction.activityDate)}</td>
                  <td className="py-2 px-2">
                    <Badge variant={getTransactionBadgeVariant(transaction.transCode)} className="text-xs">
                      {transaction.transCode}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 max-w-xs truncate" title={transaction.description}>
                    {transaction.description}
                  </td>
                  <td className="py-2 px-2">
                    {Math.abs(transaction.quantity).toFixed(transaction.quantity % 1 === 0 ? 0 : 4)}
                  </td>
                  <td className="py-2 px-2">{formatCurrency(transaction.price)}</td>
                  <td className="py-2 px-2">
                    <span className={transaction.amount >= 0 ? "text-blue-500" : "text-red-500"}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <Alert variant="warning" className="mb-6">
            <AlertCircle className="h-4 w-4" />
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
            <div className="rounded-md overflow-hidden border">
              <DataTable
                columns={tradeColumns}
                data={filteredTrades.filter((trade) => trade.assetType === "option")}
                pagination={true}
              />
            </div>
            {expandedTrades.map((tradeId) => renderExpandedTradeDetails(tradeId))}
          </TabsContent>

          <TabsContent value="stocks" className="space-y-4">
            <div className="rounded-md overflow-hidden border">
              <DataTable
                columns={tradeColumns}
                data={filteredTrades.filter((trade) => trade.assetType === "stock")}
                pagination={true}
              />
            </div>
            {expandedTrades.map((tradeId) => renderExpandedTradeDetails(tradeId))}
          </TabsContent>

          <TabsContent value="dividends" className="space-y-4">
            <div className="rounded-md overflow-hidden border">
              <DataTable
                columns={transactionColumns}
                data={filteredTransactions.filter(
                  (transaction) =>
                    transaction.transCode === "CDIV" || transaction.description.toLowerCase().includes("dividend"),
                )}
                pagination={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="transfers" className="space-y-4">
            <div className="rounded-md overflow-hidden border">
              <DataTable
                columns={transactionColumns}
                data={filteredTransactions.filter(
                  (transaction) =>
                    transaction.transCode === "ACH" ||
                    transaction.description.toLowerCase().includes("transfer") ||
                    transaction.description.toLowerCase().includes("deposit") ||
                    transaction.description.toLowerCase().includes("withdrawal"),
                )}
                pagination={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="fees" className="space-y-4">
            <div className="rounded-md overflow-hidden border">
              <DataTable
                columns={transactionColumns}
                data={filteredTransactions.filter(
                  (transaction) =>
                    transaction.transCode === "AFEE" ||
                    transaction.description.toLowerCase().includes("fee") ||
                    transaction.description.toLowerCase().includes("commission"),
                )}
                pagination={true}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card/50 backdrop-blur-md">
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
                        />
                        <label htmlFor="dividends" className="text-sm">
                          Dividends & Income
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="dividends"
                          checked={includeTypes.dividends}
                          onCheckedChange={(checked) => setIncludeTypes({ ...includeTypes, dividends: !!checked })}
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
                      />
                      <label htmlFor="createNew" className="text-sm">
                        Create new instruments if not found
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-md">
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

            <Card className="bg-card/50 backdrop-blur-md">
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
                      className="w-full"
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

      <CardFooter className="flex justify-between bg-muted/30 px-6 py-4">
        <Button variant="outline" onClick={onBack}>
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
              className={`relative ${importSuccess ? "bg-green-600 hover:bg-green-700" : ""}`}
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
