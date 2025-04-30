"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function StrategyForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "custom",
  })

  // Fetch the current user's ID
  useEffect(() => {
    async function getUserId() {
      try {
        setIsLoading(true)
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (!session?.user) {
          toast({
            title: "Authentication required",
            description: "Please sign in to create a strategy",
            variant: "destructive",
          })
          router.push("/auth/login")
          return
        }

        setUserId(session.user.id)
      } catch (error) {
        console.error("Error fetching user session:", error)
        toast({
          title: "Authentication error",
          description: "Could not verify your identity. Please try signing in again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    getUserId()
  }, [router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a strategy",
        variant: "destructive",
      })
      return
    }

    if (!formData.name) {
      toast({
        title: "Missing information",
        description: "Please provide a strategy name",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Use the new stored procedure to create the strategy
      const { data, error } = await supabase.rpc("create_strategy", {
        user_id: userId,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        is_active: true,
        timeframes: [],
        market_conditions: [],
      })

      if (error) throw error

      toast({
        title: "Strategy created",
        description: "Your new strategy has been created successfully.",
      })

      // The data returned is the new strategy ID
      if (data) {
        router.push(`/playbook/${data}/edit`)
      } else {
        router.push("/playbook")
      }
    } catch (error) {
      console.error("Error creating strategy:", error)
      toast({
        title: "Error creating strategy",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/playbook")} className="pl-0 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Playbook
        </Button>
      </div>

      <Card className="bg-background/30 backdrop-blur-md border-muted">
        <CardHeader>
          <CardTitle>Create New Strategy</CardTitle>
          <CardDescription>Define a new trading strategy for your playbook</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Strategy Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Breakout with Volume Confirmation"
                  className="bg-background/50"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your strategy..."
                  className="bg-background/50 min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakout">Breakout</SelectItem>
                    <SelectItem value="support_resistance">Support & Resistance</SelectItem>
                    <SelectItem value="moving_average">Moving Average</SelectItem>
                    <SelectItem value="gap">Gap</SelectItem>
                    <SelectItem value="pullback">Pullback</SelectItem>
                    <SelectItem value="chart_pattern">Chart Pattern</SelectItem>
                    <SelectItem value="trend_following">Trend Following</SelectItem>
                    <SelectItem value="reversal">Reversal</SelectItem>
                    <SelectItem value="volatility">Volatility</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Strategy
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
