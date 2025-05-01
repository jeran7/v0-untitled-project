"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { motion } from "framer-motion"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface CSVImportProps {
  onFileLoaded: (content: string, filename: string) => void
  isLoading?: boolean
  acceptedFileTypes?: string[]
  maxSize?: number
}

export function CSVImport({
  onFileLoaded,
  isLoading = false,
  acceptedFileTypes = [".csv"],
  maxSize = 5242880, // 5MB
}: CSVImportProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null)

      if (acceptedFiles.length === 0) {
        return
      }

      const file = acceptedFiles[0]

      if (file.size > maxSize) {
        setError(`File size exceeds the ${maxSize / 1024 / 1024}MB limit`)
        return
      }

      const reader = new FileReader()

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      }

      reader.onload = () => {
        try {
          const content = reader.result as string
          onFileLoaded(content, file.name)
          setUploadProgress(100)
        } catch (err) {
          setError("Failed to parse CSV file")
          setUploadProgress(0)
        }
      }

      reader.onerror = () => {
        setError("Failed to read file")
        setUploadProgress(0)
      }

      reader.readAsText(file)
    },
    [maxSize, onFileLoaded],
  )

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "text/csv": acceptedFileTypes,
    },
    maxSize,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => {
      setIsDragActive(false)
      setError("Invalid file type. Please upload a CSV file.")
    },
  })

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0.9, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-xl transition-all duration-300",
          "bg-background/80 backdrop-blur-[20px]",
          "border-muted-foreground/20 hover:border-muted-foreground/40",
          isDragActive && "border-primary/50 bg-primary/5",
          isDragReject && "border-destructive/50 bg-destructive/5",
          isLoading && "opacity-70 pointer-events-none",
        )}
        {...getRootProps()}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">{isDragActive ? "Drop your CSV file here" : "Upload your CSV file"}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Drag and drop your CSV file here, or click to select a file
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>Accepted formats: CSV</span>
          </div>

          <Button type="button" variant="outline" className="mt-4" disabled={isLoading}>
            Select File
          </Button>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full max-w-xs mt-6">
            <Progress value={uploadProgress} className="h-1" />
            <p className="mt-2 text-xs text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center mt-4 text-sm text-destructive"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </motion.div>
        )}

        {uploadProgress === 100 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center mt-4 text-sm text-primary"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            File uploaded successfully
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
