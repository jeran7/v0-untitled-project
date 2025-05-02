import { v4 as uuidv4 } from "uuid"
import type { ProcessedTransaction, CompleteTrade, ImportSummary } from "@/types/import"

// Add debug logging
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Trade Pairing] ${message}`, data)
  }
}

export function pairTrades(transactions: ProcessedTransaction[]): CompleteTrade[] {
  debugLog(`Starting trade pairing with ${transactions.length} transactions`)

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => a.activityDate.getTime() - b.activityDate.getTime())

  // Group transactions by symbol and asset type
  const groupedTransactions: Record<string, ProcessedTransaction[]> = {}

  for (const transaction of sortedTransactions) {
    // Skip non-trade transactions
    if (
      transaction.assetType === "cash" ||
      transaction.transCode === "CDIV" ||
      transaction.transCode === "AFEE" ||
      transaction.transCode === "INT" ||
      transaction.transCode === "ACH"
    ) {
      continue
    }

    // For options, create a more specific key that includes strike price and expiration
    let key = `${transaction.symbol}-${transaction.assetType}`

    if (transaction.assetType === "option" && transaction.optionDetails) {
      // Include strike price and expiration in the key for options
      const { strikePrice, expirationDate, optionType } = transaction.optionDetails
      key = `${transaction.symbol}-${transaction.assetType}-${strikePrice}-${expirationDate.toISOString()}-${optionType}`
    }

    if (!groupedTransactions[key]) {
      groupedTransactions[key] = []
    }
    groupedTransactions[key].push(transaction)
  }

  // Process each group to create trades
  const trades: CompleteTrade[] = []

  for (const key in groupedTransactions) {
    const transactions = groupedTransactions[key]

    // Extract symbol and asset type from the key
    const keyParts = key.split("-")
    const symbol = keyParts[0]
    const assetType = keyParts[1] as "stock" | "option"

    // Process based on asset type
    if (assetType === "stock") {
      const stockTrades = pairStockTrades(transactions, symbol)
      trades.push(...stockTrades)
    } else if (assetType === "option") {
      const optionTrades = pairOptionTrades(transactions, symbol)
      trades.push(...optionTrades)
    }
  }

  debugLog(`Paired ${trades.length} trades`)
  return trades
}

function pairStockTrades(transactions: ProcessedTransaction[], symbol: string): CompleteTrade[] {
  const trades: CompleteTrade[] = []
  let position = 0
  let costBasis = 0
  let entryDate: Date | null = null
  let fees = 0
  let tradeTransactions: ProcessedTransaction[] = []

  for (const transaction of transactions) {
    // Add transaction to the current trade
    tradeTransactions.push(transaction)

    if (transaction.transCode === "Buy") {
      // Buy transaction
      if (position === 0) {
        // Starting a new position
        entryDate = transaction.activityDate
      }

      // Update position and cost basis
      const quantity = Math.abs(transaction.quantity)
      const cost = Math.abs(transaction.amount)
      position += quantity
      costBasis += cost

      // Add fees if any
      if (transaction.amount < 0 && Math.abs(transaction.amount) > transaction.quantity * transaction.price) {
        fees += Math.abs(transaction.amount) - transaction.quantity * transaction.price
      }
    } else if (transaction.transCode === "Sell") {
      // Sell transaction
      const quantity = Math.abs(transaction.quantity)
      const proceeds = Math.abs(transaction.amount)

      // Calculate profit/loss for this sale
      const avgCostPerShare = position > 0 ? costBasis / position : 0
      const saleValue = quantity * avgCostPerShare
      const profitLoss = proceeds - saleValue

      // Update position and cost basis
      position -= quantity
      costBasis = position > 0 ? (costBasis * (position + quantity - quantity)) / (position + quantity) : 0

      // Add fees if any
      if (transaction.amount > 0 && transaction.amount < transaction.quantity * transaction.price) {
        fees += transaction.quantity * transaction.price - transaction.amount
      }

      // Create a completed trade if position is closed
      if (position === 0 || quantity >= position + quantity) {
        const trade: CompleteTrade = {
          id: uuidv4(),
          symbol,
          assetType: "stock",
          entryDate: entryDate!,
          exitDate: transaction.activityDate,
          duration: Math.round((transaction.activityDate.getTime() - entryDate!.getTime()) / (1000 * 60 * 60 * 24)),
          entryPrice: costBasis / quantity,
          exitPrice: proceeds / quantity,
          quantity,
          profitLoss,
          profitLossPercent: (profitLoss / saleValue) * 100,
          status: "closed",
          transactions: [...tradeTransactions],
          fees,
        }

        trades.push(trade)

        // Reset for next trade
        tradeTransactions = []
        fees = 0

        // If we still have position left, start a new trade
        if (position > 0) {
          entryDate = transaction.activityDate
        } else {
          entryDate = null
        }
      }
    }
  }

  // If we still have an open position, create an open trade
  if (position > 0 && entryDate) {
    const trade: CompleteTrade = {
      id: uuidv4(),
      symbol,
      assetType: "stock",
      entryDate,
      entryPrice: costBasis / position,
      quantity: position,
      profitLoss: 0, // No profit/loss for open positions
      profitLossPercent: 0,
      status: "open",
      transactions: [...tradeTransactions],
      fees,
    }

    trades.push(trade)
  }

  return trades
}

function pairOptionTrades(transactions: ProcessedTransaction[], symbol: string): CompleteTrade[] {
  debugLog(`Pairing option trades for ${symbol} with ${transactions.length} transactions`)

  // First, check if we have any option transactions
  if (transactions.length === 0) return []

  // Get option details from the first transaction
  const firstTx = transactions[0]
  if (!firstTx.optionDetails) {
    console.error("Option transactions missing option details:", transactions)
    return []
  }

  // Group transactions by option contract (same strike, expiration, and type)
  const optionGroups: Record<string, ProcessedTransaction[]> = {}

  for (const transaction of transactions) {
    if (!transaction.optionDetails) continue

    const { strikePrice, expirationDate, optionType } = transaction.optionDetails
    const key = `${strikePrice}-${expirationDate.toISOString()}-${optionType}`

    if (!optionGroups[key]) {
      optionGroups[key] = []
    }

    optionGroups[key].push(transaction)
  }

  const trades: CompleteTrade[] = []

  // Process each option contract group
  for (const key in optionGroups) {
    const contractTransactions = optionGroups[key]

    // Separate BTO and STC transactions
    const btoTransactions = contractTransactions.filter(
      (t) => t.transCode === "BTO" || (t.transCode === "Buy" && t.description.toLowerCase().includes("option")),
    )

    const stcTransactions = contractTransactions.filter(
      (t) => t.transCode === "STC" || (t.transCode === "Sell" && t.description.toLowerCase().includes("option")),
    )

    const oexpTransactions = contractTransactions.filter((t) => t.transCode === "OEXP")

    debugLog(
      `Contract ${key}: ${btoTransactions.length} BTO, ${stcTransactions.length} STC, ${oexpTransactions.length} OEXP`,
    )

    // Skip if no transactions
    if (btoTransactions.length === 0 && stcTransactions.length === 0) continue

    // Get option details
    const optionDetails = contractTransactions[0].optionDetails

    // Calculate total BTO quantity and cost
    let totalBtoQuantity = 0
    let totalBtoCost = 0
    let earliestEntryDate = new Date(8640000000000000) // Max date

    for (const bto of btoTransactions) {
      totalBtoQuantity += Math.abs(bto.quantity)
      totalBtoCost += Math.abs(bto.amount)

      if (bto.activityDate < earliestEntryDate) {
        earliestEntryDate = bto.activityDate
      }
    }

    // Calculate total STC quantity and proceeds
    let totalStcQuantity = 0
    let totalStcProceeds = 0
    let latestExitDate = new Date(0) // Min date

    for (const stc of stcTransactions) {
      totalStcQuantity += Math.abs(stc.quantity)
      totalStcProceeds += Math.abs(stc.amount)

      if (stc.activityDate > latestExitDate) {
        latestExitDate = stc.activityDate
      }
    }

    // Check for expiration
    const hasExpiration = oexpTransactions.length > 0
    const expirationDate = hasExpiration ? oexpTransactions[0].activityDate : null

    // Determine if we have a complete trade (BTO and STC quantities match)
    const isCompleteTrade = totalBtoQuantity > 0 && totalStcQuantity > 0

    // Determine if we have an expired trade
    const isExpiredTrade =
      totalBtoQuantity > 0 && hasExpiration && (totalStcQuantity === 0 || totalStcQuantity < totalBtoQuantity)

    // Create a complete trade if we have matching BTO and STC
    if (isCompleteTrade) {
      // If STC quantity is less than BTO quantity, we have a partial close
      const closedQuantity = Math.min(totalBtoQuantity, totalStcQuantity)
      const remainingQuantity = totalBtoQuantity - closedQuantity

      // Calculate cost basis for the closed portion
      const closedCostBasis = (totalBtoCost / totalBtoQuantity) * closedQuantity

      // Calculate profit/loss
      const profitLoss = totalStcProceeds - closedCostBasis

      // Create the trade
      const trade: CompleteTrade = {
        id: uuidv4(),
        symbol,
        assetType: "option",
        entryDate: earliestEntryDate,
        exitDate: latestExitDate,
        duration: Math.round((latestExitDate.getTime() - earliestEntryDate.getTime()) / (1000 * 60 * 60 * 24)),
        entryPrice: totalBtoCost / totalBtoQuantity, // Average entry price per contract
        exitPrice: totalStcProceeds / totalStcQuantity, // Average exit price per contract
        quantity: closedQuantity,
        profitLoss,
        profitLossPercent: (profitLoss / closedCostBasis) * 100,
        status: "closed",
        transactions: [...btoTransactions, ...stcTransactions],
        fees: 0, // Calculate fees if needed
        optionDetails,
      }

      trades.push(trade)

      // If we have remaining quantity and it expired, create an expired trade
      if (remainingQuantity > 0 && hasExpiration) {
        const remainingCostBasis = (totalBtoCost / totalBtoQuantity) * remainingQuantity

        const expiredTrade: CompleteTrade = {
          id: uuidv4(),
          symbol,
          assetType: "option",
          entryDate: earliestEntryDate,
          exitDate: expirationDate!,
          duration: Math.round((expirationDate!.getTime() - earliestEntryDate.getTime()) / (1000 * 60 * 60 * 24)),
          entryPrice: totalBtoCost / totalBtoQuantity,
          exitPrice: 0, // Expired worthless
          quantity: remainingQuantity,
          profitLoss: -remainingCostBasis, // Lost the entire cost basis
          profitLossPercent: -100, // 100% loss
          status: "expired",
          transactions: [...btoTransactions, ...oexpTransactions],
          fees: 0,
          optionDetails,
        }

        trades.push(expiredTrade)
      }
      // If we have remaining quantity but no expiration, create an open trade
      else if (remainingQuantity > 0) {
        const openTrade: CompleteTrade = {
          id: uuidv4(),
          symbol,
          assetType: "option",
          entryDate: earliestEntryDate,
          entryPrice: totalBtoCost / totalBtoQuantity,
          quantity: remainingQuantity,
          profitLoss: 0, // No P&L for open positions
          profitLossPercent: 0,
          status: "open",
          transactions: [...btoTransactions],
          fees: 0,
          optionDetails,
        }

        trades.push(openTrade)
      }
    }
    // If we only have BTO and expiration, create an expired trade
    else if (isExpiredTrade) {
      const trade: CompleteTrade = {
        id: uuidv4(),
        symbol,
        assetType: "option",
        entryDate: earliestEntryDate,
        exitDate: expirationDate!,
        duration: Math.round((expirationDate!.getTime() - earliestEntryDate.getTime()) / (1000 * 60 * 60 * 24)),
        entryPrice: totalBtoCost / totalBtoQuantity,
        exitPrice: 0, // Expired worthless
        quantity: totalBtoQuantity,
        profitLoss: -totalBtoCost, // Lost the entire cost basis
        profitLossPercent: -100, // 100% loss
        status: "expired",
        transactions: [...btoTransactions, ...oexpTransactions],
        fees: 0,
        optionDetails,
      }

      trades.push(trade)
    }
    // If we only have BTO, create an open trade
    else if (totalBtoQuantity > 0) {
      const trade: CompleteTrade = {
        id: uuidv4(),
        symbol,
        assetType: "option",
        entryDate: earliestEntryDate,
        entryPrice: totalBtoCost / totalBtoQuantity,
        quantity: totalBtoQuantity,
        profitLoss: 0, // No P&L for open positions
        profitLossPercent: 0,
        status: "open",
        transactions: [...btoTransactions],
        fees: 0,
        optionDetails,
      }

      trades.push(trade)
    }
    // If we only have STC, create an estimated trade
    else if (totalStcQuantity > 0) {
      // Estimate entry date as 1 day before earliest STC
      const estimatedEntryDate = new Date(latestExitDate.getTime() - 86400000)
      // Estimate entry price as 80% of exit price (assuming 20% profit)
      const estimatedEntryPrice = (totalStcProceeds / totalStcQuantity) * 0.8
      const estimatedCostBasis = estimatedEntryPrice * totalStcQuantity
      const estimatedProfit = totalStcProceeds - estimatedCostBasis

      const trade: CompleteTrade = {
        id: uuidv4(),
        symbol,
        assetType: "option",
        entryDate: estimatedEntryDate,
        exitDate: latestExitDate,
        duration: 1, // Estimated 1 day
        entryPrice: estimatedEntryPrice,
        exitPrice: totalStcProceeds / totalStcQuantity,
        quantity: totalStcQuantity,
        profitLoss: estimatedProfit,
        profitLossPercent: (estimatedProfit / estimatedCostBasis) * 100,
        status: "closed",
        transactions: [...stcTransactions],
        fees: 0,
        optionDetails,
      }

      trades.push(trade)
    }
  }

  return trades
}

export function calculateImportSummary(trades: CompleteTrade[], transactions: ProcessedTransaction[]): ImportSummary {
  // Initialize summary
  const summary: ImportSummary = {
    totalTrades: trades.length,
    completedTrades: 0,
    openPositions: 0,
    expiredOptions: 0,
    totalProfitLoss: 0,
    winCount: 0,
    lossCount: 0,
    winRate: 0,
    averageWin: 0,
    averageLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    dividends: 0,
    fees: 0,
    transfers: 0,
  }

  // Process trades
  let totalWins = 0
  let totalLosses = 0
  let winCount = 0
  let lossCount = 0

  for (const trade of trades) {
    if (trade.status === "closed") {
      summary.completedTrades++
      summary.totalProfitLoss += trade.profitLoss

      if (trade.profitLoss > 0) {
        winCount++
        totalWins += trade.profitLoss
        summary.largestWin = Math.max(summary.largestWin, trade.profitLoss)
      } else if (trade.profitLoss < 0) {
        lossCount++
        totalLosses += Math.abs(trade.profitLoss)
        summary.largestLoss = Math.max(summary.largestLoss, Math.abs(trade.profitLoss))
      }

      summary.fees += trade.fees
    } else if (trade.status === "open") {
      summary.openPositions++
    } else if (trade.status === "expired") {
      summary.expiredOptions++
      summary.completedTrades++
      summary.totalProfitLoss += trade.profitLoss
      lossCount++
      totalLosses += Math.abs(trade.profitLoss)
    }
  }

  // Calculate win rate and averages
  summary.winCount = winCount
  summary.lossCount = lossCount
  summary.winRate = winCount / (winCount + lossCount) || 0
  summary.averageWin = winCount > 0 ? totalWins / winCount : 0
  summary.averageLoss = lossCount > 0 ? totalLosses / lossCount : 0

  // Process other transactions
  for (const transaction of transactions) {
    if (transaction.transCode === "CDIV") {
      summary.dividends += transaction.amount
    } else if (transaction.transCode === "AFEE") {
      summary.fees += Math.abs(transaction.amount)
    } else if (transaction.transCode === "ACH") {
      summary.transfers += transaction.amount
    }
  }

  return summary
}
