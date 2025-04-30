"use client"

import { useState } from "react"
import Image from "next/image"
import { Camera, Download, PencilRuler, Plus, Trash, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function TradeFormImages() {
  const [images, setImages] = useState<{ id: number; name: string; type: string; url: string }[]>([
    {
      id: 1,
      name: "Pre-trade Setup",
      type: "screenshot",
      url: "/upward-trend-analysis.png",
    },
  ])

  const [activeTab, setActiveTab] = useState("upload")

  const addImage = (type: string) => {
    // In a real app, this would handle actual file uploads
    const newImage = {
      id: images.length + 1,
      name: `Image ${images.length + 1}`,
      type,
      url: `/placeholder.svg?height=300&width=500&query=stock ${type === "screenshot" ? "chart" : "annotation"}`,
    }

    setImages([...images, newImage])
  }

  const deleteImage = (id: number) => {
    setImages(images.filter((img) => img.id !== id))
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
          <TabsTrigger value="annotate">Annotate</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6 mt-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <h3 className="font-medium text-lg">Drag & Drop Files</h3>
              <p className="text-sm text-muted-foreground">Drop your image files here or click to browse</p>
              <Input
                type="file"
                className="hidden"
                id="file-upload"
                accept="image/*"
                multiple
                onChange={() => addImage("upload")}
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" className="mt-2 gap-1">
                  <Plus className="h-4 w-4" />
                  Browse Files
                </Button>
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Supported Formats</h3>
            <p className="text-sm text-muted-foreground">JPG, PNG, GIF, WebP up to 10MB</p>
          </div>
        </TabsContent>

        <TabsContent value="screenshot" className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Take Screenshot</h3>
              <Button variant="outline" className="gap-1" onClick={() => addImage("screenshot")}>
                <Camera className="h-4 w-4" />
                Capture
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-background/20">
              <div className="aspect-video relative bg-black/20 rounded-md overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">Chart preview will appear here</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="screenshot-name">Screenshot Name</Label>
                <Input id="screenshot-name" placeholder="e.g., Entry Point" className="bg-background/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot-type">Type</Label>
                <select
                  id="screenshot-type"
                  className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2"
                >
                  <option value="entry">Entry Point</option>
                  <option value="exit">Exit Point</option>
                  <option value="setup">Setup</option>
                  <option value="pattern">Pattern</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="annotate" className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Annotate Chart</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <PencilRuler className="h-4 w-4" />
                  Draw
                </Button>
                <Button variant="outline" size="sm" onClick={() => addImage("annotation")}>
                  <Download className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-background/20">
              <div className="aspect-video relative bg-black/20 rounded-md overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">Select an image to annotate</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto py-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative h-20 w-32 flex-shrink-0 rounded-md overflow-hidden border cursor-pointer hover:border-primary"
                >
                  <Image src={img.url || "/placeholder.svg"} alt={img.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">Image Gallery</h3>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Image
            </Button>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img) => (
                <div key={img.id} className="group relative border rounded-lg overflow-hidden">
                  <div className="aspect-video relative">
                    <Image src={img.url || "/placeholder.svg"} alt={img.name} fill className="object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="w-full flex items-center justify-between">
                      <span className="text-white text-sm font-medium">{img.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:text-destructive hover:bg-white/20"
                        onClick={() => deleteImage(img.id)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border rounded-md border-dashed text-center text-muted-foreground">
              <p>No images added yet</p>
              <p className="text-sm">Upload or capture screenshots to add them to your trade</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-medium text-lg">Image Tags</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-3 w-3" />
            Entry
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-3 w-3" />
            Exit
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-3 w-3" />
            Support
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-3 w-3" />
            Resistance
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-3 w-3" />
            Pattern
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-3 w-3" />
            Add Tag
          </Button>
        </div>
      </div>
    </div>
  )
}
