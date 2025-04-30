"use client"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Calendar, Grid, MapIcon as HeatMap } from "lucide-react"

interface TradesViewToggleProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function TradesViewToggle({ activeView, onViewChange }: TradesViewToggleProps) {
  return (
    <ToggleGroup type="single" value={activeView} onValueChange={(value) => value && onViewChange(value)}>
      <ToggleGroupItem value="table" aria-label="Table view">
        <Grid className="h-4 w-4 mr-2" />
        Table
      </ToggleGroupItem>
      <ToggleGroupItem value="calendar" aria-label="Calendar view">
        <Calendar className="h-4 w-4 mr-2" />
        Calendar
      </ToggleGroupItem>
      <ToggleGroupItem value="heatmap" aria-label="Heatmap view">
        <HeatMap className="h-4 w-4 mr-2" />
        Heatmap
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
