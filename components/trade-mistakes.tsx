"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from "lucide-react"

const mistakeCategories = [
  { name: "Entry", color: "destructive" },
  { name: "Exit", color: "destructive" },
  { name: "Position Size", color: "destructive" },
  { name: "Stop Loss", color: "destructive" },
  { name: "Take Profit", color: "destructive" },
  { name: "Timing", color: "destructive" },
  { name: "Emotional", color: "destructive" },
  { name: "Technical", color: "destructive" },
  { name: "Fundamental", color: "destructive" },
]

interface Mistake {
  id: number
  category: string
  description: string
}

export default function TradeMistakes() {
  const [mistakes, setMistakes] = useState<Mistake[]>([
    {
      id: 1,
      category: "Entry",
      description: "Entered too early before confirmation of breakout pattern",
    },
    {
      id: 2,
      category: "Position Size",
      description: "Position size was too small relative to the quality of the setup",
    },
    {
      id: 3,
      category: "Exit",
      description: "Exited too early, leaving significant profit on the table",
    },
  ])

  const [newMistake, setNewMistake] = useState<Partial<Mistake>>({
    category: "",
    description: "",
  })

  const addMistake = () => {
    if (newMistake.category && newMistake.description) {
      setMistakes([
        ...mistakes,
        {
          id: Date.now(),
          category: newMistake.category,
          description: newMistake.description,
        },
      ])
      setNewMistake({ category: "", description: "" })
    }
  }

  const removeMistake = (id: number) => {
    setMistakes(mistakes.filter((mistake) => mistake.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Trade Mistakes</h3>
        <div className="space-y-3">
          {mistakes.map((mistake) => (
            <div key={mistake.id} className="flex items-start gap-2 group">
              <Badge variant="destructive" className="mt-0.5">
                {mistake.category}
              </Badge>
              <span className="flex-1">{mistake.description}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMistake(mistake.id)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Add Mistake</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {mistakeCategories.map((category) => (
              <Badge
                key={category.name}
                variant={newMistake.category === category.name ? "destructive" : "outline"}
                className="cursor-pointer"
                onClick={() => setNewMistake({ ...newMistake, category: category.name })}
              >
                {category.name}
              </Badge>
            ))}
          </div>
          <Textarea
            placeholder="Describe the mistake..."
            value={newMistake.description}
            onChange={(e) => setNewMistake({ ...newMistake, description: e.target.value })}
            className="min-h-[100px]"
          />
          <Button onClick={addMistake} disabled={!newMistake.category || !newMistake.description}>
            <Plus className="h-4 w-4 mr-2" />
            Add Mistake
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Lessons Learned</h3>
        <Textarea
          placeholder="What did you learn from these mistakes?"
          className="min-h-[120px]"
          defaultValue="Wait for confirmation of the pattern before entering. Increase position size on high-conviction setups. Implement a trailing stop or partial exit strategy to capture more of the move."
        />
      </div>
    </div>
  )
}
