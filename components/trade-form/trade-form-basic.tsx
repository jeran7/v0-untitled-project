"use client"

import { useState } from "react"
import { CalendarIcon, Plus, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface TradeFormBasicProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  direction: "Long" | "Short"
}

export default function TradeFormBasic({ formData, updateFormData, direction }: TradeFormBasicProps) {
  const [exits, setExits] = useState([{ price: 0, quantity: 0, time: format(new Date(), "HH:mm"), date: new Date() }])

  const addExit = () => {
    setExits([...exits, { price: 0, quantity: 0, time: format(new Date(), "HH:mm"), date: new Date() }])
  }

  const removeExit = (index: number) => {
    setExits(exits.filter((_, i) => i !== index))
  }

  const updateExit = (index: number, field: string, value: any) => {
    const newExits = [...exits]
    newExits[index] = { ...newExits[index], [field]: value }
    setExits(newExits)

    // Calculate P&L
    calculatePnL()
  }

  const calculatePnL = () => {
    const entry = Number.parseFloat(formData.entry.toString())
    const quantity = Number.parseFloat(formData.quantity.toString())
    const commission = Number.parseFloat(formData.commission.toString()) || 0
    const fees = Number.parseFloat(formData.fees.toString()) || 0

    let totalPnL = 0
    let totalQuantity = 0

    exits.forEach((exit) => {
      const exitPrice = Number.parseFloat(exit.price.toString()) || 0
      const exitQuantity = Number.parseFloat(exit.quantity.toString()) || 0

      if (exitPrice && exitQuantity) {
        const pnlPerShare = direction === "Long" ? exitPrice - entry : entry - exitPrice

        totalPnL += pnlPerShare * exitQuantity
        totalQuantity += exitQuantity
      }
    })

    // Ensure we don't exceed total quantity
    if (totalQuantity > quantity) {
      totalPnL = (totalPnL / totalQuantity) * quantity
      totalQuantity = quantity
    }

    const netPnL = totalPnL - commission - fees

    updateFormData("pnl", netPnL.toFixed(2))
  }

  const handleEntryChange = (value: string) => {
    updateFormData("entry", Number.parseFloat(value) || 0)
    calculatePnL()
  }

  const handleQuantityChange = (value: string) => {
    updateFormData("quantity", Number.parseFloat(value) || 0)
    calculatePnL()
  }

  const handleCommissionChange = (value: string) => {
    updateFormData("commission", Number.parseFloat(value) || 0)
    calculatePnL()
  }

  const handleFeesChange = (value: string) => {
    updateFormData("fees", Number.parseFloat(value) || 0)
    calculatePnL()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entry Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Entry Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry-price">Entry Price</Label>
              <Input
                id="entry-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.entry || ""}
                onChange={(e) => handleEntryChange(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={formData.quantity || ""}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-background/50">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(), "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={new Date()} onSelect={() => {}} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-time">Entry Time</Label>
              <div className="flex items-center">
                <Input
                  id="entry-time"
                  type="time"
                  defaultValue={format(new Date(), "HH:mm")}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Costs & P&L */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Costs & P&L</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commission">Commission</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.commission || ""}
                onChange={(e) => handleCommissionChange(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fees">Fees</Label>
              <Input
                id="fees"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.fees || ""}
                onChange={(e) => handleFeesChange(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Total Costs</Label>
            <div className="p-2 border rounded-md bg-background/50">
              ${((Number.parseFloat(formData.commission) || 0) + (Number.parseFloat(formData.fees) || 0)).toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estimated P&L</Label>
            <div
              className={cn(
                "p-2 border rounded-md font-medium text-lg",
                Number.parseFloat(formData.pnl) > 0
                  ? "text-[hsl(var(--profit))]"
                  : Number.parseFloat(formData.pnl) < 0
                    ? "text-[hsl(var(--loss))]"
                    : "",
              )}
            >
              ${Number.parseFloat(formData.pnl) ? formData.pnl : "0.00"}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Exit Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Exit Details</h3>
          <Button variant="outline" size="sm" onClick={addExit} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Exit
          </Button>
        </div>

        {exits.map((exit, index) => (
          <div key={index} className="p-4 border rounded-md bg-background/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Exit {index + 1}</h4>
              {exits.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExit(index)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Remove exit</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`exit-price-${index}`}>Exit Price</Label>
                <Input
                  id={`exit-price-${index}`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={exit.price || ""}
                  onChange={(e) => updateExit(index, "price", Number.parseFloat(e.target.value) || 0)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`exit-quantity-${index}`}>Quantity</Label>
                <Input
                  id={`exit-quantity-${index}`}
                  type="number"
                  placeholder="0"
                  value={exit.quantity || ""}
                  onChange={(e) => updateExit(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Exit Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-background/50">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(exit.date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={exit.date}
                      onSelect={(date) => updateExit(index, "date", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`exit-time-${index}`}>Exit Time</Label>
                <div className="flex items-center">
                  <Input
                    id={`exit-time-${index}`}
                    type="time"
                    value={exit.time}
                    onChange={(e) => updateExit(index, "time", e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>
            </div>

            {/* Per-exit P&L calculation */}
            {exit.price && exit.quantity && formData.entry && (
              <div className="mt-4 p-2 border rounded-md bg-background/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">P&L for this exit:</span>
                  <span
                    className={cn(
                      "font-medium",
                      direction === "Long"
                        ? exit.price > formData.entry
                          ? "text-[hsl(var(--profit))]"
                          : "text-[hsl(var(--loss))]"
                        : exit.price < formData.entry
                          ? "text-[hsl(var(--profit))]"
                          : "text-[hsl(var(--loss))]",
                    )}
                  >
                    {direction === "Long"
                      ? ((exit.price - formData.entry) * exit.quantity).toFixed(2)
                      : ((formData.entry - exit.price) * exit.quantity).toFixed(2)}{" "}
                    USD
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
