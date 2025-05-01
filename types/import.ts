export type TransactionType =
  | "BTO" // Buy to Open (Options)
  | "STC" // Sell to Close (Options)
  | "Buy" // Stock Purchase
  | "Sell" // Stock Sale
  | "CDIV" // Cash Dividend
  | "AFEE" // Account Fee
  | "OEXP" // Option Expiration
  | "SLIP" // Price Slippage
  | "INT" // Interest
  | "DCF" // Direct Cash Fund
  | "RTP" // Return to Principal
  | "ACH" // ACH Transfer
  | "OTHER" // Other transaction types

export type AssetType = "stock" | "option" | "cash" | "crypto" | "unknown"

export interface RawTransaction {
  activityDate: Date
  processDate: Date
  settleDate: Date
  instrument: string
  description: string
  transCode: TransactionType
  quantity: number
  price: number
  amount: number
  rowIndex: number // To track original position in CSV
}

export interface ProcessedTransaction extends RawTransaction {
  symbol: string
  assetType: AssetType
  optionDetails?: {
    strikePrice: number
    expirationDate: Date
    optionType: "call" | "put"
  }
  isRecurring?: boolean
  tradeId?: string // Used to group related transactions
}

export interface CompleteTrade {
  id: string
  symbol: string
  assetType: AssetType
  entryDate: Date
  exitDate?: Date
  duration?: number // In days
  entryPrice: number
  exitPrice?: number
  quantity: number
  profitLoss: number
  profitLossPercent: number
  status: "open" | "closed" | "expired"
  transactions: ProcessedTransaction[]
  fees: number
  optionDetails?: {
    strikePrice: number
    expirationDate: Date
    optionType: "call" | "put"
  }
}

export interface ImportSummary {
  totalTrades: number
  completedTrades: number
  openPositions: number
  expiredOptions: number
  totalProfitLoss: number
  winCount: number
  lossCount: number
  winRate: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  dividends: number
  fees: number
  transfers: number
}

export interface BrokerImportConfig {
  name: string
  logo: string
  fileExtensions: string[]
  requiredColumns: string[]
  sampleFile?: string
  description: string
}

export interface ImportProgress {
  stage: "idle" | "uploading" | "parsing" | "processing" | "preview" | "confirming" | "importing" | "complete" | "error"
  progress: number // 0-100
  message: string
  error?: string
}

export interface BrokerConfig {
  id: string
  name: string
  logo: string
  description: string
  csvFormat: {
    headers: string[]
    requiredFields: string[]
    dateFormat: string
  }
}

export interface ImportConfig {
  dateRange: { from: Date; to: Date } | undefined
  includeTypes: Record<string, boolean>
  createNewInstruments: boolean
  selectedTransactions: string[]
  selectedTrades: string[]
}
