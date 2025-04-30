"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StrategyLibrary } from "@/components/playbook/strategy-library"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Layers, BarChart3 } from "lucide-react"

export default function PlaybookPage() {
  const [activeTab, setActiveTab] = useState("strategies")

  return (
    <div className="flex flex-col gap-6 p-6 animate-in">
      <div className="glass-card rounded-lg p-6 animate-slide-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Strategy Playbook</h1>
            <p className="text-muted-foreground">Manage your trading strategies and measure how well you follow them</p>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="animate-slide-in"
        style={{ animationDelay: "150ms" }}
      >
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="strategies" className="gap-2">
            <BookOpen className="h-4 w-4" />
            My Strategies
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Layers className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="mt-6">
          <StrategyLibrary />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Strategy Templates</CardTitle>
              <CardDescription>
                Use these pre-built templates as a starting point for your own strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Strategy templates will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Strategy Performance</CardTitle>
              <CardDescription>Analyze how your strategies are performing across your trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Performance analytics will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
