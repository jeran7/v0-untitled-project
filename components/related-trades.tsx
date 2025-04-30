"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from "lucide-react"

interface RelatedTrade {
  id: string
  symbol: string
  date: string
  setup: string
  pnl: number
  pnlPercent: number
  status: "Win" | "Loss" | "Breakeven"
}

const relatedTrades: RelatedTrade[] = [
  {
    id: "T-985",
    symbol: "AAPL",
    date: "Feb 15, 2023",
    setup: "Breakout",
    pnl: 385.5,
    pnlPercent: 2.1,
    status: "Win",
  },
  {
    id: "T-932",
    symbol: "MSFT",
    date: "Feb 8, 2023",
    setup: "Breakout",
    pnl: 420.75,
    pnlPercent: 2.4,
    status: "Win",
  },
  {
    id: "T-897",
    symbol: "GOOGL",
    date: "Jan 27, 2023",
    setup: "Breakout",
    pnl: -210.25,
    pnlPercent: -1.2,
    status: "Loss",
  },
  {
    id: "T-865",
    symbol: "AMZN",
    date: "Jan 18, 2023",
    setup: "Breakout",
    pnl: 540.3,
    pnlPercent: 2.7,
    status: "Win",
  },
  {
    id: "T-823",
    symbol: "META",
    date: "Jan 5, 2023",
    setup: "Breakout",
    pnl: 325.45,
    pnlPercent: 1.8,
    status: "Win",
  },
]

export default function RelatedTrades() {
  return (
    <>
      {relatedTrades.map((trade) => (
        <Link href={`/trades/${trade.id}`} key={trade.id} className="group">
          <Card className="glass-card w-[250px] transition-all duration-200 hover:shadow-lg hover:border-primary/50 group-hover:bg-secondary/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-lg">{trade.symbol}</div>
                <Badge
                  variant={trade.status === "Win" ? "success" : trade.status === "Loss" ? "destructive" : "outline"}
                >
                  {trade.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-2">{trade.date}</div>
              <div className="text-sm mb-2">Setup: {trade.setup}</div>
              <div
                className={`font-medium ${trade.pnl > 0 ? "profit-text" : "loss-text"} flex items-center justify-between`}
              >
                {trade.pnl > 0 ? "+" : ""}
                {trade.pnl.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xs text-muted-foreground">
                {trade.pnl > 0 ? "+" : ""}
                {trade.pnlPercent}%
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </>
  )
}
