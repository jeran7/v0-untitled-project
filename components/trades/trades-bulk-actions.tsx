"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Download, Tag, Trash } from "lucide-react"

interface TradesBulkActionsProps {
  selectedCount: number
  onAction: (action: string) => void
}

export function TradesBulkActions({ selectedCount, onAction }: TradesBulkActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1" disabled={selectedCount === 0}>
          {selectedCount > 0 ? `${selectedCount} Selected` : "No Selection"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction("export")} className="gap-2">
          <Download className="h-4 w-4" />
          Export Selected
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("tag")} className="gap-2">
          <Tag className="h-4 w-4" />
          Add Tags
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("delete")} className="gap-2 text-destructive">
          <Trash className="h-4 w-4" />
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
