"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TradeFormPsychologyProps {
  formData: any
  updateFormData: (field: string, value: any) => void
}

export default function TradeFormPsychology({ formData, updateFormData }: TradeFormPsychologyProps) {
  const getConfidenceLabel = (value: number) => {
    if (value <= 20) return "Very Low"
    if (value <= 40) return "Low"
    if (value <= 60) return "Medium"
    if (value <= 80) return "High"
    return "Very High"
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Emotional State</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-medium">{getConfidenceLabel(formData.confidence)}</span>
              </div>
              <Slider
                value={[formData.confidence]}
                max={100}
                step={1}
                className="w-full"
                onValueChange={(value) => updateFormData("confidence", value[0])}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Focus</span>
                <span className="font-medium">{getConfidenceLabel(formData.focus)}</span>
              </div>
              <Slider
                value={[formData.focus]}
                max={100}
                step={1}
                className="w-full"
                onValueChange={(value) => updateFormData("focus", value[0])}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patience</span>
                <span className="font-medium">{getConfidenceLabel(formData.patience)}</span>
              </div>
              <Slider
                value={[formData.patience]}
                max={100}
                step={1}
                className="w-full"
                onValueChange={(value) => updateFormData("patience", value[0])}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stress Level</span>
                <span className="font-medium">{getConfidenceLabel(formData.stress)}</span>
              </div>
              <Slider
                value={[formData.stress]}
                max={100}
                step={1}
                className="w-full"
                onValueChange={(value) => updateFormData("stress", value[0])}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">FOMO</span>
                <span className="font-medium">{getConfidenceLabel(formData.fomo)}</span>
              </div>
              <Slider
                value={[formData.fomo]}
                max={100}
                step={1}
                className="w-full"
                onValueChange={(value) => updateFormData("fomo", value[0])}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discipline</span>
                <span className="font-medium">{getConfidenceLabel(formData.discipline)}</span>
              </div>
              <Slider
                value={[formData.discipline]}
                max={100}
                step={1}
                className="w-full"
                onValueChange={(value) => updateFormData("discipline", value[0])}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Decision Making</h3>
        <Textarea
          placeholder="Describe your decision-making process..."
          className="min-h-[120px] bg-background/50"
          value={formData.decisionMaking || ""}
          onChange={(e) => updateFormData("decisionMaking", e.target.value)}
        />
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">External Factors</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sleep Quality</Label>
              <Select onValueChange={(value) => updateFormData("sleepQuality", value)} defaultValue="good">
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select sleep quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent (8+ hours)</SelectItem>
                  <SelectItem value="good">Good (7-8 hours)</SelectItem>
                  <SelectItem value="average">Average (6-7 hours)</SelectItem>
                  <SelectItem value="poor">Poor (5-6 hours)</SelectItem>
                  <SelectItem value="very-poor">Very Poor ({"< 5 hours"})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Physical State</Label>
              <RadioGroup defaultValue="energetic" onValueChange={(value) => updateFormData("physicalState", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="energetic" id="energetic" />
                  <Label htmlFor="energetic">Energetic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tired" id="tired" />
                  <Label htmlFor="tired">Tired</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="exhausted" id="exhausted" />
                  <Label htmlFor="exhausted">Exhausted</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Environment</Label>
              <Select onValueChange={(value) => updateFormData("environment", value)} defaultValue="quiet">
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiet">Quiet, Focused</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="noisy">Noisy</SelectItem>
                  <SelectItem value="distracting">Very Distracting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Distractions</Label>
              <Select onValueChange={(value) => updateFormData("distractions", value)} defaultValue="none">
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select distractions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="significant">Significant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Trading Time</Label>
              <Select onValueChange={(value) => updateFormData("tradingTime", value)} defaultValue="market-open">
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select trading time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre-market">Pre-Market</SelectItem>
                  <SelectItem value="market-open">Market Open</SelectItem>
                  <SelectItem value="mid-day">Mid-Day</SelectItem>
                  <SelectItem value="power-hour">Power Hour</SelectItem>
                  <SelectItem value="market-close">Market Close</SelectItem>
                  <SelectItem value="after-hours">After Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
