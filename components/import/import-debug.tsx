"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bug, Code, Database, FileJson } from "lucide-react"

interface ImportDebugProps {
  transactions: any[]
  trades: any[]
  summary: any
}

export function ImportDebug({ transactions, trades, summary }: ImportDebugProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => setIsOpen(true)}
      >
        <Bug className="h-4 w-4 mr-2" /> Debug Import
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-[600px] max-h-[80vh] overflow-auto shadow-xl border-red-300">
      <CardHeader className="bg-red-500/10 border-b border-red-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Bug className="h-4 w-4 mr-2" /> Import Debug Panel
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="summary">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="summary" className="flex-1">
              <Database className="h-4 w-4 mr-2" /> Summary
            </TabsTrigger>
            <TabsTrigger value="trades" className="flex-1">
              <FileJson className="h-4 w-4 mr-2" /> Trades
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1">
              <Code className="h-4 w-4 mr-2" /> Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="p-4">
            <div className="space-y-2">
              <h3 className="font-medium">Import Summary</h3>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-[400px]">
                {JSON.stringify(summary, null, 2)}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="trades" className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Trades Data</h3>
                <Badge>{trades.length} trades</Badge>
              </div>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-[400px]">
                {JSON.stringify(trades, null, 2)}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Transactions Data</h3>
                <Badge>{transactions.length} transactions</Badge>
              </div>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-[400px]">
                {JSON.stringify(transactions, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
