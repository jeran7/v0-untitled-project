"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Copy, Tag, Download, FileText, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface TradesBulkActionsProps {
  selectedTrades?: string[]
}

export function TradesBulkActions({ selectedTrades = [] }: TradesBulkActionsProps) {
  const hasSelection = selectedTrades.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {hasSelection && (
          <span className="text-sm text-muted-foreground">
            {selectedTrades.length} {selectedTrades.length === 1 ? "trade" : "trades"} selected
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex items-center gap-1" disabled={!hasSelection}>
          <Tag className="h-4 w-4" />
          <span className="hidden sm:inline">Add Tags</span>
        </Button>
        <Button variant="outline" size="sm" className="flex items-center gap-1" disabled={!hasSelection}>
          <Copy className="h-4 w-4" />
          <span className="hidden sm:inline">Duplicate</span>
        </Button>
        <Button variant="outline" size="sm" className="flex items-center gap-1" disabled={!hasSelection}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 text-destructive hover:bg-destructive/10"
          disabled={!hasSelection}
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={!hasSelection}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={!hasSelection}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!hasSelection}>
              <Tag className="h-4 w-4 mr-2" />
              Categorize
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
