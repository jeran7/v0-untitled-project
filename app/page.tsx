"use client"

import { useState } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  ChevronDownIcon,
  FilterIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import EquityCurveChart from "@/components/equity-curve-chart"
import RecentTradesTable from "@/components/recent-trades-table"
import PerformanceMetrics from "@/components/performance-metrics"
import WinRateChart from "@/components/win-rate-chart"

export default function Dashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="flex flex-col gap-6 p-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your trading performance at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {date ? format(date, "MMM dd, yyyy") : "Select date"}
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon">
            <RefreshCwIcon className="h-4 w-4" />
          </Button>
          <Button className="gap-2">
            <PlusIcon className="h-4 w-4" />
            New Trade
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card animate-slide-in" style={{ animationDelay: "0ms" }}>
          <CardHeader className="pb-2">
            <CardDescription>Total P&L</CardDescription>
            <CardTitle className="text-2xl profit-text">+$12,458.32</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowUpIcon className="h-4 w-4 text-[hsl(var(--profit))]" />
              <span>+8.2% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card animate-slide-in" style={{ animationDelay: "50ms" }}>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
            <CardTitle className="text-2xl">68.5%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowUpIcon className="h-4 w-4 text-[hsl(var(--profit))]" />
              <span>+3.5% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card animate-slide-in" style={{ animationDelay: "100ms" }}>
          <CardHeader className="pb-2">
            <CardDescription>Profit Factor</CardDescription>
            <CardTitle className="text-2xl">2.34</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowUpIcon className="h-4 w-4 text-[hsl(var(--profit))]" />
              <span>+0.21 from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card animate-slide-in" style={{ animationDelay: "150ms" }}>
          <CardHeader className="pb-2">
            <CardDescription>Total Trades</CardDescription>
            <CardTitle className="text-2xl">124</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowDownIcon className="h-4 w-4 text-[hsl(var(--loss))]" />
              <span>-12 from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card md:col-span-2 animate-slide-in" style={{ animationDelay: "200ms" }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Equity Curve</CardTitle>
              <CardDescription>Your account growth over time</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <span>30 Days</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>7 Days</DropdownMenuItem>
                <DropdownMenuItem>30 Days</DropdownMenuItem>
                <DropdownMenuItem>90 Days</DropdownMenuItem>
                <DropdownMenuItem>1 Year</DropdownMenuItem>
                <DropdownMenuItem>All Time</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <EquityCurveChart />
          </CardContent>
        </Card>

        <Card className="glass-card animate-slide-in" style={{ animationDelay: "250ms" }}>
          <CardHeader>
            <CardTitle>Win Rate by Setup</CardTitle>
            <CardDescription>Performance by strategy</CardDescription>
          </CardHeader>
          <CardContent>
            <WinRateChart />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="animate-slide-in" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-secondary/30">
            <TabsTrigger value="recent">Recent Trades</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" className="gap-1">
            <FilterIcon className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
        <TabsContent value="recent" className="mt-4">
          <Card className="glass-card">
            <CardContent className="p-0">
              <RecentTradesTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <PerformanceMetrics />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
