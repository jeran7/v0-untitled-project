"use client"

import { useState } from "react"
import { Mic, Play, Square, Trash } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"

interface TradeFormNotesProps {
  formData: any
  updateFormData: (field: string, value: any) => void
}

export default function TradeFormNotes({ formData, updateFormData }: TradeFormNotesProps) {
  const [voiceNotes, setVoiceNotes] = useState<{ id: number; name: string; duration: string; date: Date }[]>([
    { id: 1, name: "Pre-trade Analysis", duration: "1:24", date: new Date() },
  ])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [checklist, setChecklist] = useState({
    planFollowed: false,
    entryValid: false,
    stopValid: false,
    riskAppropriate: false,
    emotionsControlled: false,
    patternValid: false,
    volumeAdequate: false,
    timeFrameAligned: false,
  })

  const handleChecklistChange = (field: string, checked: boolean) => {
    setChecklist({
      ...checklist,
      [field]: checked,
    })
  }

  const startRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)

    // Simulate recording timer
    const timer = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)

    // Store timer ID for cleanup
    // @ts-ignore
    window.recordingTimer = timer
  }

  const stopRecording = () => {
    setIsRecording(false)

    // Clear the timer
    // @ts-ignore
    clearInterval(window.recordingTimer)

    // Add new voice note
    const newNote = {
      id: voiceNotes.length + 1,
      name: `Voice Note ${voiceNotes.length + 1}`,
      duration: formatTime(recordingTime),
      date: new Date(),
    }

    setVoiceNotes([...voiceNotes, newNote])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const deleteVoiceNote = (id: number) => {
    setVoiceNotes(voiceNotes.filter((note) => note.id !== id))
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="notes">
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="voice">Voice Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-6 mt-4">
          <div>
            <h3 className="text-lg font-medium mb-4">Trade Notes</h3>
            <Textarea
              placeholder="Enter your detailed trade notes here..."
              className="min-h-[150px] bg-background/50"
              value={formData.notes || ""}
              onChange={(e) => updateFormData("notes", e.target.value)}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">What Went Well</h3>
              <Textarea
                placeholder="What aspects of the trade were executed well?"
                className="min-h-[120px] bg-background/50"
                value={formData.wentWell || ""}
                onChange={(e) => updateFormData("wentWell", e.target.value)}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">What Could Improve</h3>
              <Textarea
                placeholder="What could have been done better?"
                className="min-h-[120px] bg-background/50"
                value={formData.couldImprove || ""}
                onChange={(e) => updateFormData("couldImprove", e.target.value)}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Key Lessons</h3>
            <Textarea
              placeholder="What did you learn from this trade?"
              className="min-h-[100px] bg-background/50"
              value={formData.lessons || ""}
              onChange={(e) => updateFormData("lessons", e.target.value)}
            />
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6 mt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pre-Trade Checklist</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="plan-followed"
                  checked={checklist.planFollowed}
                  onCheckedChange={(checked) => handleChecklistChange("planFollowed", checked as boolean)}
                />
                <Label htmlFor="plan-followed">Trade plan followed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="entry-valid"
                  checked={checklist.entryValid}
                  onCheckedChange={(checked) => handleChecklistChange("entryValid", checked as boolean)}
                />
                <Label htmlFor="entry-valid">Valid entry signal confirmed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stop-valid"
                  checked={checklist.stopValid}
                  onCheckedChange={(checked) => handleChecklistChange("stopValid", checked as boolean)}
                />
                <Label htmlFor="stop-valid">Stop loss at logical level</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="risk-appropriate"
                  checked={checklist.riskAppropriate}
                  onCheckedChange={(checked) => handleChecklistChange("riskAppropriate", checked as boolean)}
                />
                <Label htmlFor="risk-appropriate">Risk within parameters</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emotions-controlled"
                  checked={checklist.emotionsControlled}
                  onCheckedChange={(checked) => handleChecklistChange("emotionsControlled", checked as boolean)}
                />
                <Label htmlFor="emotions-controlled">Emotions in check</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pattern-valid"
                  checked={checklist.patternValid}
                  onCheckedChange={(checked) => handleChecklistChange("patternValid", checked as boolean)}
                />
                <Label htmlFor="pattern-valid">Pattern matches strategy</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="volume-adequate"
                  checked={checklist.volumeAdequate}
                  onCheckedChange={(checked) => handleChecklistChange("volumeAdequate", checked as boolean)}
                />
                <Label htmlFor="volume-adequate">Adequate volume</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timeframe-aligned"
                  checked={checklist.timeFrameAligned}
                  onCheckedChange={(checked) => handleChecklistChange("timeFrameAligned", checked as boolean)}
                />
                <Label htmlFor="timeframe-aligned">Multiple timeframes aligned</Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Setup Description</h3>
            <Textarea
              placeholder="Describe the setup that triggered this trade..."
              className="min-h-[120px] bg-background/50"
              value={formData.setupDescription || ""}
              onChange={(e) => updateFormData("setupDescription", e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Market Context</h3>
            <Textarea
              placeholder="Describe the broader market context..."
              className="min-h-[120px] bg-background/50"
              value={formData.marketContext || ""}
              onChange={(e) => updateFormData("marketContext", e.target.value)}
            />
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Voice Notes</h3>

              {isRecording ? (
                <div className="flex items-center gap-2">
                  <div className="animate-pulse h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">{formatTime(recordingTime)}</span>
                  <Button variant="outline" size="sm" onClick={stopRecording} className="gap-1">
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={startRecording} className="gap-1">
                  <Mic className="h-4 w-4" />
                  Record Voice Note
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {voiceNotes.map((note) => (
                <div key={note.id} className="p-3 border rounded-md bg-background/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                      <Play className="h-4 w-4" />
                    </Button>
                    <div>
                      <p className="font-medium">{note.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {note.duration} • {format(note.date, "MMM d, yyyy - h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteVoiceNote(note.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              ))}
            </div>

            {voiceNotes.length === 0 && (
              <div className="p-8 border rounded-md border-dashed text-center text-muted-foreground">
                <p>No voice notes recorded yet</p>
                <p className="text-sm">Click the Record button to add a voice note</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
