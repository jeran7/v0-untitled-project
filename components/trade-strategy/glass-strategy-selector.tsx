"use client"

import { useState, useEffect } from "react"
import { Search, Plus, ChevronDown, X, Info } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useStrategies } from "@/hooks/use-strategies"
import { StrategyForm } from "@/components/playbook/strategy-form"

interface StrategyPreviewProps {
  strategy: any
  onClose: () => void
}

const StrategyPreview = ({ strategy, onClose }: StrategyPreviewProps) => {
  if (!strategy) return null

  return (
    <div className="glass-card p-4 mt-2 rounded-lg relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        aria-label="Close preview"
      >
        <X size={16} />
      </button>
      <h4 className="text-lg font-semibold text-white mb-1">{strategy.name}</h4>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="glass-badge text-xs">
          {strategy.category}
        </Badge>
        <span className="text-xs text-gray-300">{strategy.timeframe}</span>
      </div>
      <p className="text-sm text-gray-300 line-clamp-2 mb-2">{strategy.description}</p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Rules:</span>
        <span className="text-xs text-gray-300">{strategy.rules?.length || 0}</span>
      </div>
    </div>
  )
}

interface StrategySelectProps {
  value?: string
  onChange: (value: string) => void
  onCreateNew?: () => void
}

export function GlassStrategySelector({ value, onChange, onCreateNew }: StrategySelectProps) {
  const [open, setOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const { strategies, isLoading, error } = useStrategies()
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null)

  useEffect(() => {
    if (value && strategies) {
      const strategy = strategies.find((s) => s.id === value)
      setSelectedStrategy(strategy)
    } else {
      setSelectedStrategy(null)
    }
  }, [value, strategies])

  const handleSelect = (strategyId: string) => {
    onChange(strategyId)
    setOpen(false)
    setShowPreview(true)
  }

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew()
    } else {
      setCreateDialogOpen(true)
    }
    setOpen(false)
  }

  const handleStrategyCreated = (newStrategy: any) => {
    setCreateDialogOpen(false)
    onChange(newStrategy.id)
    setShowPreview(true)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200">Strategy</label>
        {error && (
          <div className="flex items-center text-red-400 text-xs">
            <Info size={12} className="mr-1" />
            Error loading strategies
          </div>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between glass-input border-0 text-left font-normal"
            disabled={isLoading}
          >
            {isLoading ? (
              <Skeleton className="h-4 w-[100px]" />
            ) : selectedStrategy ? (
              <span className="truncate">{selectedStrategy.name}</span>
            ) : (
              <span className="text-gray-400">Select a strategy...</span>
            )}
            <ChevronDown size={16} className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 glass-dropdown border-0" align="start">
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search strategies..."
              className="glass-input border-0"
              startIcon={<Search className="h-4 w-4 text-gray-400" />}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-6 text-center text-sm text-gray-400">No strategies found.</CommandEmpty>
              {isLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <CommandGroup>
                  {strategies?.map((strategy) => (
                    <CommandItem
                      key={strategy.id}
                      value={strategy.id}
                      onSelect={() => handleSelect(strategy.id)}
                      className="flex items-center gap-2 hover:bg-white/10"
                    >
                      <div className="flex-1 truncate">
                        <span className="font-medium">{strategy.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="glass-badge text-xs">
                            {strategy.category}
                          </Badge>
                          <span className="text-xs text-gray-400">{strategy.timeframe}</span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                  <div className="px-2 py-1.5 border-t border-gray-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                      onClick={handleCreateNew}
                    >
                      <Plus size={16} className="mr-2" />
                      Create new strategy
                    </Button>
                  </div>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showPreview && selectedStrategy && (
        <StrategyPreview strategy={selectedStrategy} onClose={() => setShowPreview(false)} />
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="glass-card border-0 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Create New Strategy</DialogTitle>
          </DialogHeader>
          <StrategyForm onSuccess={handleStrategyCreated} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
