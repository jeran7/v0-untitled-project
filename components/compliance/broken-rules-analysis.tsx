"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BrokenRule {
  id: string
  rule: string
  frequency: number
  impact: number
  description: string
}

interface BrokenRulesAnalysisProps {
  brokenRules?: BrokenRule[]
  loading?: boolean
}

export function BrokenRulesAnalysis({ brokenRules = [], loading = false }: BrokenRulesAnalysisProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Broken Rules Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading analysis...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!brokenRules.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Broken Rules Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No broken rules</AlertTitle>
            <AlertDescription>Great job! You haven't broken any trading rules recently.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Sort rules by impact (highest first)
  const sortedRules = [...brokenRules].sort((a, b) => b.impact - a.impact)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Broken Rules Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedRules.map((rule) => (
            <div key={rule.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{rule.rule}</h3>
                <div className="flex gap-2">
                  <Badge variant="outline">Frequency: {rule.frequency}x</Badge>
                  <Badge variant={rule.impact > 7 ? "destructive" : rule.impact > 4 ? "warning" : "secondary"}>
                    Impact: {rule.impact}/10
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{rule.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
