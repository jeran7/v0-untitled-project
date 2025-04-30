"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Bold, Italic, Link, List, Mic, Save, Underline } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export default function TradeJournal() {
  const [notes, setNotes] = useState(
    "This was a solid breakout trade on AAPL following the earnings announcement. I noticed increased volume as price approached the resistance level at $152, which gave me confidence in the setup. I entered when price broke through with conviction and set my stop below the previous support level.\n\nThe trade worked out well, though I could have held longer as price continued to move up after my exit. Overall, this was a good execution of my breakout strategy.",
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  return (
    <div className="space-y-6">
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-1 border rounded-md bg-secondary/30">
            <ToggleGroup type="multiple">
              <ToggleGroupItem value="bold" aria-label="Toggle bold">
                <Bold className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Toggle italic">
                <Italic className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Toggle underline">
                <Underline className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Separator orientation="vertical" className="h-6" />
            <ToggleGroup type="multiple">
              <ToggleGroupItem value="list" aria-label="Toggle list">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="link" aria-label="Toggle link">
                <Link className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[200px]"
            placeholder="Enter your trade notes here..."
          />
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsEditing(false)} className="gap-2">
              <Save className="h-4 w-4" />
              Save Notes
            </Button>
            <Button variant="outline" onClick={() => setIsRecording(!isRecording)} className="gap-2">
              <Mic className={`h-4 w-4 ${isRecording ? "text-red-500" : ""}`} />
              {isRecording ? "Stop Recording" : "Voice Notes"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="whitespace-pre-wrap text-muted-foreground">{notes}</div>
          <Button onClick={() => setIsEditing(true)}>Edit Notes</Button>
        </div>
      )}

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Pre-Trade Checklist</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <input type="checkbox" id="checklist-1" className="mr-2" defaultChecked />
            <label htmlFor="checklist-1" className="text-sm">
              Identified key support/resistance levels
            </label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="checklist-2" className="mr-2" defaultChecked />
            <label htmlFor="checklist-2" className="text-sm">
              Confirmed trend direction
            </label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="checklist-3" className="mr-2" defaultChecked />
            <label htmlFor="checklist-3" className="text-sm">
              Checked for news/earnings events
            </label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="checklist-4" className="mr-2" defaultChecked />
            <label htmlFor="checklist-4" className="text-sm">
              Determined position size based on risk
            </label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="checklist-5" className="mr-2" defaultChecked />
            <label htmlFor="checklist-5" className="text-sm">
              Set stop loss and take profit levels
            </label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="checklist-6" className="mr-2" />
            <label htmlFor="checklist-6" className="text-sm">
              Reviewed market context and sector performance
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
