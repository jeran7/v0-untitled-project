"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePresetChange = (preset: string) => {
    const now = new Date()
    let from = new Date()

    switch (preset) {
      case "last-week":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case "last-month":
        from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      case "last-3-months":
        from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case "last-6-months":
        from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        break
      case "last-year":
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      case "all-time":
        from = new Date(2020, 0, 1) // Arbitrary start date
        break
      default:
        from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    }

    onChange({ from, to: now })
    setIsOpen(false)
  }

  return (
    <div className="flex items-center space-x-2">
      <Select onValueChange={handlePresetChange} defaultValue="last-3-months">
        <SelectTrigger className="h-10 w-[180px] bg-background/50 backdrop-blur-md border-border/40">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="last-week">Last Week</SelectItem>
          <SelectItem value="last-month">Last Month</SelectItem>
          <SelectItem value="last-3-months">Last 3 Months</SelectItem>
          <SelectItem value="last-6-months">Last 6 Months</SelectItem>
          <SelectItem value="last-year">Last Year</SelectItem>
          <SelectItem value="all-time">All Time</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal bg-background/50 backdrop-blur-md border-border/40",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} - {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onChange(range)
                setIsOpen(false)
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
