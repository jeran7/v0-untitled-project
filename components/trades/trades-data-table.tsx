"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, formatDistanceStrict } from "date-fns"
import type { Trade, TradeSortField, SortDirection } from "@/hooks/use-trades"

interface TradesDataTableProps {
  trades: Trade[]
  isLoading: boolean
  page: number
  pageSize: number
  sortBy: TradeSortField
  sortDirection: SortDirection
  totalCount: number
  selectedTrades: string[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSortChange: (field: TradeSortField) => void
  onSelectionChange: (selectedIds: string[]) => void
}

export function TradesDataTable({
  trades,
  isLoading,
  page,
  pageSize,
  sortBy,
  sortDirection,
  totalCount,
  selectedTrades,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSelectionChange,
}: TradesDataTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([{ id: sortBy, desc: sortDirection === "desc" }])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // Update external selection state when row selection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection).filter((key) => rowSelection[key])
    onSelectionChange(selectedIds)
  }, [rowSelection, onSelectionChange])

  // Update sorting state when external sort changes
  useEffect(() => {
    setSorting([{ id: sortBy, desc: sortDirection === "desc" }])
  }, [sortBy, sortDirection])

  // Define columns
  const columns: ColumnDef<Trade>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: "entry_date",
      header: ({ column }) => (
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => onSortChange("entry_date")} className="p-0 hover:bg-transparent">
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.entry_date)
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-medium">{format(date, "MMM d, yyyy")}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{format(date, "EEEE, MMMM d, yyyy h:mm a")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: "symbol",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => onSortChange("symbol")} className="p-0 hover:bg-transparent">
          Symbol
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        // In a real app, you'd have a mapping of symbols to company names
        const companyNames: Record<string, string> = {
          AAPL: "Apple Inc.",
          MSFT: "Microsoft Corporation",
          GOOGL: "Alphabet Inc.",
          AMZN: "Amazon.com Inc.",
          TSLA: "Tesla Inc.",
          META: "Meta Platforms Inc.",
          NVDA: "NVIDIA Corporation",
          "BTC-USD": "Bitcoin",
          "ETH-USD": "Ethereum",
          "EUR-USD": "Euro/US Dollar",
        }

        const symbol = row.original.symbol
        const companyName = companyNames[symbol] || symbol

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-medium">{symbol}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{companyName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: "direction",
      header: "Direction",
      cell: ({ row }) => {
        const direction = row.original.direction
        return (
          <Badge
            variant={direction === "Long" ? "default" : "secondary"}
            className={cn(
              direction === "Long"
                ? "bg-green-600/20 text-green-500 hover:bg-green-600/30"
                : "bg-red-600/20 text-red-500 hover:bg-red-600/30",
            )}
          >
            {direction}
          </Badge>
        )
      },
    },
    {
      accessorKey: "setup",
      header: "Strategy",
      cell: ({ row }) => <div>{row.original.setup || "—"}</div>,
    },
    {
      accessorKey: "entry_price",
      header: "Entry",
      cell: ({ row }) => <div className="font-mono">${Number(row.original.entry_price).toFixed(2)}</div>,
    },
    {
      accessorKey: "exit_price",
      header: "Exit",
      cell: ({ row }) => (
        <div className="font-mono">
          {row.original.exit_price ? `$${Number(row.original.exit_price).toFixed(2)}` : "—"}
        </div>
      ),
    },
    {
      accessorKey: "pnl",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => onSortChange("pnl")} className="p-0 hover:bg-transparent">
          P&L
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const pnl = row.original.pnl
        if (pnl === null) return <div>—</div>

        const isProfit = pnl > 0
        return (
          <div className={cn("font-mono font-medium", isProfit ? "profit-text" : "loss-text")}>
            {isProfit ? "+" : ""}${Number(pnl).toFixed(2)}
          </div>
        )
      },
    },
    {
      id: "pnlPercent",
      header: "P&L %",
      cell: ({ row }) => {
        const trade = row.original
        if (!trade.pnl || !trade.entry_price || !trade.quantity) return <div>—</div>

        // Calculate P&L percentage based on initial investment
        const investment = trade.entry_price * trade.quantity
        const pnlPercent = (trade.pnl / investment) * 100
        const isProfit = pnlPercent > 0

        return (
          <div className={cn("font-mono", isProfit ? "profit-text" : "loss-text")}>
            {isProfit ? "+" : ""}
            {pnlPercent.toFixed(2)}%
          </div>
        )
      },
    },
    {
      id: "rMultiple",
      header: "R-Multiple",
      cell: ({ row }) => {
        // In a real app, this would come from the trade_details table
        // For now, we'll simulate it
        const trade = row.original
        if (!trade.pnl) return <div>—</div>

        // Simulate R-multiple calculation
        const riskPerShare = trade.entry_price * 0.02 // Assume 2% risk
        const totalRisk = riskPerShare * trade.quantity
        const rMultiple = trade.pnl / totalRisk

        return (
          <div className={cn("font-mono", rMultiple > 0 ? "profit-text" : "loss-text")}>{rMultiple.toFixed(2)}R</div>
        )
      },
    },
    {
      id: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const trade = row.original
        if (!trade.entry_date || !trade.exit_date) return <div>—</div>

        const entryDate = new Date(trade.entry_date)
        const exitDate = new Date(trade.exit_date)

        return <div>{formatDistanceStrict(exitDate, entryDate)}</div>
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => onSortChange("status")} className="p-0 hover:bg-transparent">
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.original.status
        let badgeVariant: "default" | "secondary" | "destructive" | "outline" | "success" = "outline"

        switch (status) {
          case "Win":
            badgeVariant = "success"
            break
          case "Loss":
            badgeVariant = "destructive"
            break
          case "Open":
            badgeVariant = "secondary"
            break
          case "Breakeven":
            badgeVariant = "outline"
            break
        }

        return <Badge variant={badgeVariant}>{status}</Badge>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const trade = row.original

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/trades/${trade.id}`)}>View Details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/trades/${trade.id}/edit`)}>Edit Trade</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  // Initialize table
  const table = useReactTable({
    data: trades,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === "function" ? updater(sorting) : updater
      setSorting(newSorting)

      if (newSorting.length > 0) {
        const { id, desc } = newSorting[0]
        onSortChange(id as TradeSortField)
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
  })

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalCount)

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-secondary/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-12">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group transition-colors hover:bg-secondary/30 data-[state=selected]:bg-secondary/40"
                  onClick={() => router.push(`/trades/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "group-hover:animate-in group-hover:fade-in-50",
                        cell.column.id === "select" || cell.column.id === "actions"
                          ? "cursor-default"
                          : "cursor-pointer",
                      )}
                      onClick={(e) => {
                        if (cell.column.id === "select" || cell.column.id === "actions") {
                          e.stopPropagation()
                        }
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isLoading ? (
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
                      <span>Loading trades...</span>
                    </div>
                  ) : (
                    "No trades found."
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-4 border-t border-border/40">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalCount} trades
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <select
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
