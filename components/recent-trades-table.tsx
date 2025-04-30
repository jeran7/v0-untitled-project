"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Trade {
  id: string
  date: string
  symbol: string
  setup: string
  side: "Long" | "Short"
  pnl: number
  pnlPercent: number
  status: "Win" | "Loss" | "Breakeven"
}

const trades: Trade[] = [
  {
    id: "T-1001",
    date: "Mar 1, 2023",
    symbol: "AAPL",
    setup: "Breakout",
    side: "Long",
    pnl: 450.75,
    pnlPercent: 2.3,
    status: "Win",
  },
  {
    id: "T-1002",
    date: "Mar 1, 2023",
    symbol: "MSFT",
    setup: "Pullback",
    side: "Long",
    pnl: 320.5,
    pnlPercent: 1.8,
    status: "Win",
  },
  {
    id: "T-1003",
    date: "Feb 28, 2023",
    symbol: "TSLA",
    setup: "Reversal",
    side: "Short",
    pnl: -215.25,
    pnlPercent: -1.2,
    status: "Loss",
  },
  {
    id: "T-1004",
    date: "Feb 28, 2023",
    symbol: "AMZN",
    setup: "Trend",
    side: "Long",
    pnl: 540.3,
    pnlPercent: 2.7,
    status: "Win",
  },
  {
    id: "T-1005",
    date: "Feb 27, 2023",
    symbol: "META",
    setup: "Range",
    side: "Short",
    pnl: 125.45,
    pnlPercent: 0.8,
    status: "Win",
  },
]

export function RecentTradesTable() {
  const [sortColumn, setSortColumn] = useState<keyof Trade>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const sortedTrades = [...trades].sort((a, b) => {
    if (sortColumn === "pnl" || sortColumn === "pnlPercent") {
      return sortDirection === "asc" ? a[sortColumn] - b[sortColumn] : b[sortColumn] - a[sortColumn]
    }

    return sortDirection === "asc"
      ? a[sortColumn].localeCompare(b[sortColumn])
      : b[sortColumn].localeCompare(a[sortColumn])
  })

  const handleSort = (column: keyof Trade) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead onClick={() => handleSort("date")} className="cursor-pointer">
            <div className="flex items-center gap-1">
              Date
              {sortColumn === "date" && <ArrowUpDown className="h-3 w-3" />}
            </div>
          </TableHead>
          <TableHead onClick={() => handleSort("symbol")} className="cursor-pointer">
            <div className="flex items-center gap-1">
              Symbol
              {sortColumn === "symbol" && <ArrowUpDown className="h-3 w-3" />}
            </div>
          </TableHead>
          <TableHead onClick={() => handleSort("setup")} className="cursor-pointer">
            <div className="flex items-center gap-1">
              Setup
              {sortColumn === "setup" && <ArrowUpDown className="h-3 w-3" />}
            </div>
          </TableHead>
          <TableHead onClick={() => handleSort("side")} className="cursor-pointer">
            <div className="flex items-center gap-1">
              Side
              {sortColumn === "side" && <ArrowUpDown className="h-3 w-3" />}
            </div>
          </TableHead>
          <TableHead onClick={() => handleSort("pnl")} className="cursor-pointer text-right">
            <div className="flex items-center justify-end gap-1">
              P&L
              {sortColumn === "pnl" && <ArrowUpDown className="h-3 w-3" />}
            </div>
          </TableHead>
          <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
            <div className="flex items-center gap-1">
              Status
              {sortColumn === "status" && <ArrowUpDown className="h-3 w-3" />}
            </div>
          </TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTrades.map((trade) => (
          <TableRow key={trade.id} className="hover:bg-secondary/50">
            <TableCell>{trade.date}</TableCell>
            <TableCell className="font-medium">{trade.symbol}</TableCell>
            <TableCell>{trade.setup}</TableCell>
            <TableCell>
              <Badge variant={trade.side === "Long" ? "default" : "secondary"}>{trade.side}</Badge>
            </TableCell>
            <TableCell className={cn("text-right font-medium", trade.pnl > 0 ? "profit-text" : "loss-text")}>
              {trade.pnl > 0 ? "+" : ""}
              {trade.pnl.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
              <span className="text-xs ml-1">
                ({trade.pnl > 0 ? "+" : ""}
                {trade.pnlPercent}%)
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={trade.status === "Win" ? "success" : trade.status === "Loss" ? "destructive" : "outline"}>
                {trade.status}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/trades/${trade.id}`}>View Details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Edit Trade</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default RecentTradesTable
