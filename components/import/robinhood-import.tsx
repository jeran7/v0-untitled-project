"use client"

import { useState, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileUp, AlertCircle, CheckCircle2, RefreshCw, X, FileType, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { parseCSV, processTransactions } from "@/lib/csv-parser"
import { pairTrades, calculateImportSummary } from "@/lib/trade-pairing"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ImportProgress, RawTransaction, ProcessedTransaction, CompleteTrade, ImportSummary } from "@/types/import"
import { ImportPreview } from "./import-preview"
import { ImportConfirmation } from "./import-confirmation"

export function RobinhoodImport() {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<ImportProgress>({
    stage: "idle",
    progress: 0,
    message: "Drag and drop your Robinhood CSV file here, or click to select",
  })
  const [rawTransactions, setRawTransactions] = useState<RawTransaction[]>([])
  const [processedTransactions, setProcessedTransactions] = useState<ProcessedTransaction[]>([])
  const [completeTrades, setCompleteTrades] = useState<CompleteTrade[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setFile(file)
    setError(null)

    // Create a new abort controller for this import
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    try {
      // Update progress to uploading
      setProgress({
        stage: "uploading",
        progress: 10,
        message: "Uploading file...",
      })

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (signal.aborted) return

      // Update progress to parsing
      setProgress({
        stage: "parsing",
        progress: 30,
        message: "Parsing CSV data...",
      })

      // Parse the CSV file
      const transactions = await parseCSV(file)

      if (transactions.length === 0) {
        throw new Error("No valid transactions found in the CSV file. Please check the file format.")
      }

      setRawTransactions(transactions)

      if (signal.aborted) return

      // Update progress to processing
      setProgress({
        stage: "processing",
        progress: 50,
        message: "Processing transactions...",
      })

      // Process the transactions
      const processed = processTransactions(transactions)
      setProcessedTransactions(processed)

      if (signal.aborted) return

      // Update progress to pairing
      setProgress({
        stage: "processing",
        progress: 70,
        message: "Pairing trades...",
      })

      // Pair the trades
      const trades = pairTrades(processed)
      setCompleteTrades(trades)

      if (signal.aborted) return

      // Calculate summary
      const importSummary = calculateImportSummary(trades, processed)
      setSummary(importSummary)

      // Update progress to preview
      setProgress({
        stage: "preview",
        progress: 90,
        message: "Ready to preview",
      })
    } catch (error) {
      console.error("Import error:", error)
      setError(
        error instanceof Error
          ? `${error.message}. This could be due to an unexpected CSV format. Please ensure you're using the latest Robinhood export format.`
          : "Unknown error occurred during import",
      )
      setProgress({
        stage: "error",
        progress: 0,
        message: "An error occurred during import",
        error:
          error instanceof Error ? `${error.message}. Try downloading a fresh CSV from Robinhood.` : "Unknown error",
      })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
    disabled: progress.stage !== "idle" && progress.stage !== "error",
  })

  const cancelImport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setProgress({
      stage: "idle",
      progress: 0,
      message: "Drag and drop your Robinhood CSV file here, or click to select",
    })
    setFile(null)
    setRawTransactions([])
    setProcessedTransactions([])
    setCompleteTrades([])
    setSummary(null)
    setError(null)
  }

  const goToConfirmation = () => {
    setProgress({
      stage: "confirming",
      progress: 95,
      message: "Confirm import details",
    })
  }

  const goBackToPreview = () => {
    setProgress({
      stage: "preview",
      progress: 90,
      message: "Ready to preview",
    })
  }

  const completeImport = async () => {
    try {
      setProgress({
        stage: "importing",
        progress: 98,
        message: "Importing trades...",
      })

      // Simulate import delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setProgress({
        stage: "complete",
        progress: 100,
        message: "Import complete!",
      })

      // After a delay, reset the component
      setTimeout(() => {
        cancelImport()
      }, 3000)
    } catch (error) {
      console.error("Import completion error:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred during final import")
      setProgress({
        stage: "error",
        progress: 0,
        message: "An error occurred during final import",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {progress.stage === "idle" ||
        progress.stage === "uploading" ||
        progress.stage === "parsing" ||
        progress.stage === "processing" ||
        progress.stage === "error" ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Card className="glass-panel rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl">Import Robinhood Transactions</CardTitle>
                <CardDescription>Upload your Robinhood transaction history to import your trades</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ease-in-out
                    backdrop-blur-xl bg-background/90
                    ${isDragActive ? "border-primary bg-primary/10 glow-blue" : "border-border"}
                    ${isDragAccept ? "border-green-500 bg-green-500/10 glow-green" : ""}
                    ${isDragReject ? "border-red-500 bg-red-500/10 glow-red" : ""}
                    ${progress.stage === "error" ? "border-red-500" : ""}
                    ${progress.stage !== "idle" && progress.stage !== "error" ? "pointer-events-none opacity-50" : "cursor-pointer hover:border-primary/50 hover:bg-primary/5 pulse-on-hover"}
                  `}
                >
                  <input {...getInputProps()} />

                  <div className="flex flex-col items-center justify-center space-y-4">
                    {progress.stage === "idle" && (
                      <>
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                          <Upload size={32} className="text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-semibold">Upload Robinhood CSV</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Drag and drop your Robinhood CSV file here, or click to select
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileType size={16} />
                          <span>Supported file: .CSV</span>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" className="mt-2">
                                <Info size={14} className="mr-1" /> How to export from Robinhood
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                1. Log in to your Robinhood account
                                <br />
                                2. Go to Account → Statements & History
                                <br />
                                3. Select "Export" and download your transaction history as CSV
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}

                    {progress.stage === "uploading" && (
                      <>
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                          <FileUp size={32} className="text-primary animate-pulse" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-semibold">Uploading File</h3>
                          <p className="text-muted-foreground">{file?.name}</p>
                        </div>
                      </>
                    )}

                    {progress.stage === "parsing" && (
                      <>
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                          <RefreshCw size={32} className="text-primary animate-spin" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-semibold">Parsing CSV Data</h3>
                          <p className="text-muted-foreground">{file?.name}</p>
                        </div>
                      </>
                    )}

                    {progress.stage === "processing" && (
                      <>
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                          <RefreshCw size={32} className="text-primary animate-spin" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-semibold">Processing Transactions</h3>
                          <p className="text-muted-foreground">Analyzing and pairing trades</p>
                        </div>
                      </>
                    )}

                    {progress.stage === "error" && (
                      <>
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                          <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-semibold text-red-500">Import Error</h3>
                          <p className="text-muted-foreground">{error || "An unknown error occurred"}</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            cancelImport()
                          }}
                          className="mt-4"
                        >
                          Try Again
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {progress.stage !== "idle" && progress.stage !== "error" && (
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{progress.message}</span>
                      <span>{Math.round(progress.progress)}%</span>
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                    <div className="flex justify-end mt-2">
                      <Button variant="ghost" size="sm" onClick={cancelImport} className="text-muted-foreground">
                        <X size={16} className="mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/30 px-6 py-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info size={14} className="mr-2" />
                  <span>
                    Your data is processed locally in your browser. No information is sent to our servers during the
                    import preview.
                  </span>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ) : progress.stage === "preview" ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <ImportPreview
              transactions={processedTransactions}
              trades={completeTrades}
              summary={summary}
              onBack={cancelImport}
              onNext={goToConfirmation}
            />
          </motion.div>
        ) : progress.stage === "confirming" ? (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <ImportConfirmation summary={summary} onBack={goBackToPreview} onConfirm={completeImport} />
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Card className="glass-panel p-8 rounded-xl">
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-2xl font-semibold">Import Complete!</h3>
                  <p className="text-muted-foreground">
                    {completeTrades.length} trades have been successfully imported
                  </p>
                </div>
                <div className="flex gap-4 mt-4">
                  <Button onClick={cancelImport} variant="default">
                    Import Another File
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/trades">View Trades</a>
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
