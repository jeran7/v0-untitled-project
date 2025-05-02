"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Filter, Search, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { formatCurrency, formatPercent, formatDate } from "@/lib/utils"
import type { ProcessedTransaction, CompleteTrade, ImportSummary } from "@/types/import"

interface ImportPreviewProps {
  transactions: ProcessedTransaction[]
  trades: CompleteTrade[]
  summary: ImportSummary | null
  onBack: () => void
  onNext: () => void
}

export function ImportPreview({ transactions, trades, summary, onBack, onNext }: ImportPreviewProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [searchTerm, setSearchTerm] = useState("")
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const router = useRouter()

  // Filter trades based on search term and filters
  const filteredTrades = trades.filter((trade) => {
    const matchesSearch = searchTerm === "" || trade.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAssetType = assetTypeFilter === "all" || trade.assetType === assetTypeFilter
    const matchesStatus = statusFilter === "all" || trade.status === statusFilter
    return matchesSearch && matchesAssetType && matchesStatus
  })

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter((transaction) => {
    return (
      searchTerm === "" ||
      transaction.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const transactionColumns = [
    {
      accessorKey: "activityDate",
      header: "Date",
      cell: ({ row }: any) => formatDate(row.original.activityDate),
    },
    {
      accessorKey: "symbol",
      header: "Symbol",
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
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }: any) => Math.abs(row.original.quantity).toFixed(row.original.quantity % 1 === 0 ? 0 : 4),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }: any) => formatCurrency(row.original.price),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }: any) => (
        <span className={row.original.amount >= 0 ? "text-blue-500" : "text-red-500"}>
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
  ]

  const tradeColumns = [
    {
      accessorKey: "symbol",
      header: "Symbol",
      cell: ({ row }: any) => {
        const trade = row.original
        return (
          <div className="flex items-center space-x-2">
            <span className="font-medium">{trade.symbol}</span>
            <Badge variant={trade.assetType === "option" ? "outline" : "secondary"} className="text-xs">
              {trade.assetType === "option"
                ? `${trade.optionDetails?.optionType.toUpperCase()} ${formatCurrency(trade.optionDetails?.strikePrice || 0)}`
                : trade.assetType}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "entryDate",
      header: "Entry Date",
      cell: ({ row }: any) => formatDate(row.original.entryDate),
    },
    {
      accessorKey: "exitDate",
      header: "Exit Date",
      cell: ({ row }: any) => (row.original.exitDate ? formatDate(row.original.exitDate) : "Open"),
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }: any) => (row.original.duration ? `${row.original.duration} days` : "N/A"),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }: any) => Math.abs(row.original.quantity).toFixed(row.original.quantity % 1 === 0 ? 0 : 4),
    },
    {
      accessorKey: "entryPrice",
      header: "Entry Price",
      cell: ({ row }: any) => formatCurrency(row.original.entryPrice),
    },
    {
      accessorKey: "exitPrice",
      header: "Exit Price",
      cell: ({ row }: any) => (row.original.exitPrice ? formatCurrency(row.original.exitPrice) : "N/A"),
    },
    {
      accessorKey: "profitLoss",
      header: "P&L",
      cell: ({ row }: any) => {
        const pl = row.original.profitLoss
        return <span className={pl > 0 ? "text-blue-500" : pl < 0 ? "text-red-500" : ""}>{formatCurrency(pl)}</span>
      },
    },
    {
      accessorKey: "profitLossPercent",
      header: "P&L %",
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
  ]

  const handleContinue = () => {
    // Store the import data in localStorage for the review page to access
    const importId = Date.now().toString()
    localStorage.setItem(
      `import_${importId}`,
      JSON.stringify({
        transactions,
        trades,
        summary,
      }),
    )

    // Navigate to the review page with the import ID
    router.push(`/import/review?id=${importId}`)
  }

  const validateImportedData = (data: any[]): boolean => {
    if (!data || data.length === 0) {
      //setError("No data found in the imported file"); // Assuming setError is defined elsewhere
      console.error("No data found in the imported file")
      return false
    }

    // Check for required fields based on broker type
    //const requiredFields = brokerType === 'robinhood' // Assuming brokerType is defined elsewhere
    //  ? ['symbol', 'price', 'quantity', 'side', 'date']
    //  : ['symbol', 'price', 'quantity'];
    const requiredFields = ["symbol", "price", "quantity"]

    const firstRow = data[0]
    const missingFields = requiredFields.filter((field) => !(field in firstRow))

    if (missingFields.length > 0) {
      //setError(`Missing required fields: ${missingFields.join(', ')}`); // Assuming setError is defined elsewhere
      console.error(`Missing required fields: ${missingFields.join(", ")}`)
      return false
    }

    console.log("Data validation passed")
    return true
  }

  const processImportedData = useCallback(
    async (data: any[]) => {
      try {
        console.log("Processing imported data:", data)

        if (!validateImportedData(data)) {
          return
        }

        // Your existing processing code
        const processedTransactions = transactions // Replace with actual processing
        const totalTrades = trades.length
        const completedTrades = trades.filter((trade) => trade.status === "closed").length
        const openPositions = trades.filter((trade) => trade.status === "open").length

        // Store the processed data
        const sessionId = `import-${Date.now()}`
        localStorage.setItem(
          `import-session-${sessionId}`,
          JSON.stringify({
            transactions: processedTransactions,
            statistics: {
              totalTrades,
              completedTrades,
              openPositions,
              // Other stats...
            },
          }),
        )

        console.log("Data stored with session ID:", sessionId)
        console.log("Stored data:", processedTransactions)

        // Update state and redirect
        //setSessionId(sessionId); // Assuming setSessionId is defined elsewhere
        router.push(`/import/review?sessionId=${sessionId}`)
      } catch (error) {
        console.error("Error processing import data:", error)
        //setError("Failed to process imported data"); // Assuming setError is defined elsewhere
      }
    },
    [router, transactions, trades],
  )

  return (
    <Card className="glass-panel rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl">Import Preview</CardTitle>
        <CardDescription>Review your transactions before proceeding to detailed review</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="trades">Trades ({trades.length})</TabsTrigger>
            <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            {summary && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <SummaryCard
                    title="Trade Overview"
                    items={[
                      { label: "Total Trades", value: summary.totalTrades.toString() },
                      { label: "Completed Trades", value: summary.completedTrades.toString() },
                      { label: "Open Positions", value: summary.openPositions.toString() },
                      { label: "Expired Options", value: summary.expiredOptions.toString() },
                    ]}
                  />
                  <SummaryCard
                    title="Performance"
                    items={[
                      {
                        label: "Total P/L",
                        value: formatCurrency(summary.totalProfitLoss),
                        className: summary.totalProfitLoss >= 0 ? "text-blue-500" : "text-red-500",
                      },
                      {
                        label: "Win Rate",
                        value: `${(summary.winRate * 100).toFixed(1)}%`,
                        className: summary.winRate >= 0.5 ? "text-blue-500" : "text-red-500",
                      },
                      {
                        label: "Average Win",
                        value: formatCurrency(summary.averageWin),
                        className: "text-blue-500",
                      },
                      {
                        label: "Average Loss",
                        value: formatCurrency(summary.averageLoss),
                        className: "text-red-500",
                      },
                    ]}
                  />
                  <SummaryCard
                    title="Other Transactions"
                    items={[
                      { label: "Dividends", value: formatCurrency(summary.dividends) },
                      { label: "Fees", value: formatCurrency(summary.fees) },
                      { label: "Transfers", value: formatCurrency(summary.transfers) },
                    ]}
                  />
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Asset Distribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AssetTypeDistribution trades={trades} />
                    <TradeStatusDistribution trades={trades} />
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="trades">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div className="flex-1 w-full sm:max-w-xs">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search trades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 glass-input"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
                  <SelectTrigger className="w-[130px] glass-input">
                    <SelectValue placeholder="Asset Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assets</SelectItem>
                    <SelectItem value="stock">Stocks</SelectItem>
                    <SelectItem value="option">Options</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] glass-input">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" className="glass-input">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-md overflow-hidden border">
              <DataTable columns={tradeColumns} data={filteredTrades} pagination={true} />
            </div>
          </TabsContent>

          <TabsContent value="transactions"></TabsContent>

          <TabsContent value="transactions">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div className="flex-1 w-full sm:max-w-xs">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 glass-input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" size="icon" className="glass-input">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-md overflow-hidden border">
              <DataTable columns={transactionColumns} data={filteredTransactions} pagination={true} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/30 px-6 py-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        <Button onClick={handleContinue}>
          Continue to Detailed Review <ArrowRight size={16} className="ml-2" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function SummaryCard({
  title,
  items,
}: { title: string; items: { label: string; value: string; className?: string }[] }) {
  return (
    <div className="bg-card/50 backdrop-blur-md rounded-lg border p-4">
      <h3 className="font-medium mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">{item.label}</span>
            <span className={`font-medium ${item.className || ""}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AssetTypeDistribution({ trades }: { trades: CompleteTrade[] }) {
  // Count trades by asset type
  const assetCounts = trades.reduce(
    (acc, trade) => {
      acc[trade.assetType] = (acc[trade.assetType] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate percentages
  const total = trades.length

  return (
    <div className="bg-card/50 backdrop-blur-md rounded-lg border p-4">
      <h4 className="text-sm font-medium mb-3">Asset Types</h4>
      <div className="space-y-3">
        {Object.entries(assetCounts).map(([type, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={type} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{type}</span>
                <span>
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${getAssetTypeColor(type)}`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TradeStatusDistribution({ trades }: { trades: CompleteTrade[] }) {
  // Count trades by status
  const statusCounts = trades.reduce(
    (acc, trade) => {
      acc[trade.status] = (acc[trade.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate percentages
  const total = trades.length

  return (
    <div className="bg-card/50 backdrop-blur-md rounded-lg border p-4">
      <h4 className="text-sm font-medium mb-3">Trade Status</h4>
      <div className="space-y-3">
        {Object.entries(statusCounts).map(([status, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={status} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{status}</span>
                <span>
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${getStatusColor(status)}`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
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

function getAssetTypeColor(assetType: string): string {
  switch (assetType) {
    case "stock":
      return "bg-blue-500"
    case "option":
      return "bg-purple-500"
    case "cash":
      return "bg-green-500"
    case "crypto":
      return "bg-orange-500"
    default:
      return "bg-gray-500"
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "open":
      return "bg-blue-500"
    case "closed":
      return "bg-green-500"
    case "expired":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}
