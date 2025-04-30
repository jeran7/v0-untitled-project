"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import type { ComplianceData } from "@/hooks/use-compliance-data"

interface ComplianceCalendarViewProps {
  data: ComplianceData | null
  isLoading: boolean
}

export function ComplianceCalendarView({ data, isLoading }: ComplianceCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Compliance Calendar</CardTitle>
          <CardDescription>Daily compliance scores visualized as a heatmap</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.complianceHistory.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Compliance Calendar</CardTitle>
          <CardDescription>Daily compliance scores visualized as a heatmap</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No compliance history data available</p>
        </CardContent>
      </Card>
    )
  }

  // Get days in current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get compliance data for each day
  const dayComplianceMap = new Map()
  data.complianceHistory.forEach((day) => {
    dayComplianceMap.set(day.date, {
      compliance: day.compliance,
      trades: day.trades,
    })
  })

  // Get compliance for selected day
  const selectedDayData = selectedDay && dayComplianceMap.get(format(selectedDay, "yyyy-MM-dd"))

  // Helper to get color based on compliance score
  const getComplianceColor = (compliance: number) => {
    if (compliance >= 0.9) return "bg-green-900/80"
    if (compliance >= 0.8) return "bg-green-800/70"
    if (compliance >= 0.7) return "bg-green-700/60"
    if (compliance >= 0.6) return "bg-amber-700/60"
    if (compliance >= 0.5) return "bg-amber-600/50"
    if (compliance >= 0.4) return "bg-orange-600/50"
    if (compliance >= 0.3) return "bg-orange-700/60"
    if (compliance >= 0.2) return "bg-red-700/60"
    if (compliance > 0) return "bg-red-800/70"
    return "bg-muted/20"
  }

  // Handle month navigation
  const prevMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setCurrentMonth(newMonth)
  }

  const nextMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    setCurrentMonth(newMonth)
  }

  // Handle day selection
  const handleDayClick = (day: Date) => {
    const formattedDay = format(day, "yyyy-MM-dd")
    if (dayComplianceMap.has(formattedDay)) {
      setSelectedDay(day)
      setDialogOpen(true)
    }
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Compliance Calendar</CardTitle>
              <CardDescription>Daily compliance scores visualized as a heatmap</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 rounded-md hover:bg-muted/50">
                ←
              </button>
              <span className="font-medium">{format(currentMonth, "MMMM yyyy")}</span>
              <button onClick={nextMonth} className="p-2 rounded-md hover:bg-muted/50">
                →
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium py-1">
                {day}
              </div>
            ))}

            {/* Empty cells for days before the first of the month */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-start-${i}`} className="aspect-square" />
            ))}

            {/* Calendar days */}
            {daysInMonth.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd")
              const dayData = dayComplianceMap.get(dateStr)
              const hasData = !!dayData

              return (
                <div
                  key={dateStr}
                  className={`
                    aspect-square rounded-md flex flex-col items-center justify-center
                    ${hasData ? "cursor-pointer hover:ring-1 hover:ring-primary" : ""}
                    ${getComplianceColor(hasData ? dayData.compliance : 0)}
                  `}
                  onClick={() => hasData && handleDayClick(day)}
                >
                  <div className="text-sm font-medium">{format(day, "d")}</div>
                  {hasData && <div className="text-xs mt-1">{(dayData.compliance * 100).toFixed(0)}%</div>}
                </div>
              )
            })}

            {/* Empty cells for days after the end of the month */}
            {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
              <div key={`empty-end-${i}`} className="aspect-square" />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-green-900/80"></div>
                <span className="text-sm">90-100%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-green-700/60"></div>
                <span className="text-sm">70-89%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-amber-600/50"></div>
                <span className="text-sm">50-69%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-orange-700/60"></div>
                <span className="text-sm">30-49%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-red-800/70"></div>
                <span className="text-sm">0-29%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day detail dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>{selectedDay && format(selectedDay, "EEEE, MMMM d, yyyy")}</DialogTitle>
          </DialogHeader>

          {selectedDayData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-muted/30">
                  <div className="text-sm text-muted-foreground">Compliance Score</div>
                  <div className="text-2xl font-bold">{(selectedDayData.compliance * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 rounded-md bg-muted/30">
                  <div className="text-sm text-muted-foreground">Trades</div>
                  <div className="text-2xl font-bold">{selectedDayData.trades}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Trades on this day</h4>
                {/* Mock trade data - in a real app, you would fetch this */}
                {Array.from({ length: Math.min(selectedDayData.trades, 3) }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/20">
                    <div>
                      <div className="font-medium">AAPL {Math.random() > 0.5 ? "Long" : "Short"}</div>
                      <div className="text-sm text-muted-foreground">Breakout Strategy</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={Math.random() > 0.4 ? "success" : "destructive"}>
                        {Math.random() > 0.4 ? "+$320" : "-$180"}
                      </Badge>
                      <Badge variant="outline">{(Math.random() * 100).toFixed(0)}% Compliance</Badge>
                    </div>
                  </div>
                ))}

                {selectedDayData.trades > 3 && (
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    + {selectedDayData.trades - 3} more trades
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
