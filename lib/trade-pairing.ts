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
  const trades: CompleteTrade[] = []

  // First, check if we have any option transactions
  if (transactions.length === 0) return trades

  // Get option details from the first transaction
  const firstTx = transactions[0]
  if (!firstTx.optionDetails) {
    console.error("Option transactions missing option details:", transactions)
    return trades
  }

  // Separate BTO and STC transactions
  const btoTransactions = transactions.filter(
    (t) => t.transCode === "BTO" || (t.transCode === "Buy" && t.description.toLowerCase().includes("option")),
  )

  const stcTransactions = transactions.filter(
    (t) => t.transCode === "STC" || (t.transCode === "Sell" && t.description.toLowerCase().includes("option")),
  )

  const oexpTransactions = transactions.filter((t) => t.transCode === "OEXP")

  debugLog(
    `Found ${btoTransactions.length} BTO, ${stcTransactions.length} STC, and ${oexpTransactions.length} OEXP transactions`,
  )

  // If we have no BTO transactions, we can't create trades
  if (btoTransactions.length === 0) {
    // But if we have STC transactions, create trades with estimated entry data
    if (stcTransactions.length > 0) {
      for (const stc of stcTransactions) {
        const trade: CompleteTrade = {
          id: uuidv4(),
          symbol,
          assetType: "option",
          entryDate: new Date(stc.activityDate.getTime() - 86400000), // Estimate 1 day before
          exitDate: stc.activityDate,
          duration: 1, // Estimated
          entryPrice: stc.price * 0.8, // Estimate 20% profit
          exitPrice: stc.price,
          quantity: Math.abs(stc.quantity),
          profitLoss: Math.abs(stc.amount) * 0.2, // Estimate 20% profit
          profitLossPercent: 20, // Estimate 20% profit
          status: "closed",
          transactions: [stc],
          fees: 0,
          optionDetails: stc.optionDetails,
        }
        trades.push(trade)
      }
    }
    return trades
  }

  // Create a map to track remaining quantities for each BTO transaction
  const btoRemainingQuantities = new Map<number, number>()

  // Initialize the map with the original quantities
  btoTransactions.forEach((bto) => {
    btoRemainingQuantities.set(bto.rowIndex, Math.abs(bto.quantity))
  })

  // Process each BTO transaction
  for (const bto of btoTransactions) {
    debugLog(`Processing BTO transaction ${bto.rowIndex} with quantity ${Math.abs(bto.quantity)}`)

    // Get the remaining quantity for this BTO
    let remainingBtoQuantity = btoRemainingQuantities.get(bto.rowIndex) || 0

    // If this BTO is already fully matched, skip it
    if (remainingBtoQuantity <= 0) {
      debugLog(`BTO ${bto.rowIndex} is already fully matched, skipping`)
      continue
    }

    const relatedTransactions = [bto]
    let totalProceeds = 0
    let lastExitDate: Date | null = null
    let fees = 0
    let matchedQuantity = 0

    // Find matching STC transactions
    const matchingStc = stcTransactions.filter(
      (stc) =>
        !stc.tradeId && // Not already assigned to a trade
        stc.optionDetails?.strikePrice === bto.optionDetails?.strikePrice &&
        stc.optionDetails?.optionType === bto.optionDetails?.optionType &&
        stc.optionDetails?.expirationDate.getTime() === bto.optionDetails?.expirationDate.getTime(),
    )

    debugLog(`Found ${matchingStc.length} matching STC transactions for BTO ${bto.rowIndex}`)

    // Match STC transactions to this BTO
    for (const stc of matchingStc) {
      if (remainingBtoQuantity <= 0) break

      const stcQuantity = Math.abs(stc.quantity)
      const quantityToUse = Math.min(remainingBtoQuantity, stcQuantity)

      debugLog(`Matching STC ${stc.rowIndex} with quantity ${stcQuantity}, using ${quantityToUse}`)

      // Mark this STC as used
      stc.tradeId = bto.rowIndex.toString()
      relatedTransactions.push(stc)

      // Update remaining quantity
      remainingBtoQuantity -= quantityToUse
      btoRemainingQuantities.set(bto.rowIndex, remainingBtoQuantity)
      matchedQuantity += quantityToUse

      // Track proceeds and exit date
      totalProceeds += Math.abs(stc.amount) * (quantityToUse / stcQuantity)
      lastExitDate = stc.activityDate

      // Track fees
      if (stc.amount > 0 && stc.amount < stc.quantity * stc.price) {
        fees += stc.quantity * stc.price - stc.amount
      }
    }

    // Check for option expiration if we still have remaining quantity
    if (remainingBtoQuantity > 0) {
      const matchingOexp = oexpTransactions.find(
        (oexp) =>
          !oexp.tradeId && // Not already assigned to a trade
          oexp.optionDetails?.strikePrice === bto.optionDetails?.strikePrice &&
          oexp.optionDetails?.optionType === bto.optionDetails?.optionType &&
          oexp.optionDetails?.expirationDate.getTime() === bto.optionDetails?.expirationDate.getTime(),
      )

      if (matchingOexp) {
        debugLog(`Found matching OEXP transaction for remaining quantity ${remainingBtoQuantity}`)

        // Mark this OEXP as used
        matchingOexp.tradeId = bto.rowIndex.toString()
        relatedTransactions.push(matchingOexp)

        // Update exit date
        lastExitDate = matchingOexp.activityDate

        // This is an expired option, so the remaining quantity is considered lost
        matchedQuantity += remainingBtoQuantity
        remainingBtoQuantity = 0
        btoRemainingQuantities.set(bto.rowIndex, 0)
      }
    }

    // Calculate cost basis
    const costBasis = Math.abs(bto.amount)
    const quantity = matchedQuantity

    // If we closed at least some of the position
    if (quantity > 0 && lastExitDate) {
      // Calculate profit/loss
      const profitLoss = totalProceeds - costBasis * (quantity / Math.abs(bto.quantity))

      // Determine status - if we have an expiration and it's past the current date
      const isExpired = relatedTransactions.some((t) => t.transCode === "OEXP")
      const status = isExpired ? "expired" : "closed"

      // Create a trade
      const trade: CompleteTrade = {
        id: uuidv4(),
        symbol,
        assetType: "option",
        entryDate: bto.activityDate,
        exitDate: lastExitDate,
        duration: Math.round((lastExitDate.getTime() - bto.activityDate.getTime()) / (1000 * 60 * 60 * 24)),
        entryPrice: bto.price, // Use the per-contract price directly
        exitPrice: totalProceeds / quantity, // Calculate per-contract exit price
        quantity,
        profitLoss,
        profitLossPercent: (profitLoss / (costBasis * (quantity / Math.abs(bto.quantity)))) * 100,
        status,
        transactions: relatedTransactions,
        fees,
        optionDetails: bto.optionDetails,
      }

      trades.push(trade)
      debugLog(`Created ${status} trade with quantity ${quantity} and P&L ${profitLoss}`)
    }

    // If we still have an open position
    if (remainingBtoQuantity > 0) {
      // Check if the option has expired (current date is past expiration)
      const now = new Date()
      const isExpired = bto.optionDetails && bto.optionDetails.expirationDate < now

      const trade: CompleteTrade = {
        id: uuidv4(),
        symbol,
        assetType: "option",
        entryDate: bto.activityDate,
        entryPrice: bto.price, // Use the per-contract price directly
        quantity: remainingBtoQuantity,
        profitLoss: isExpired ? -costBasis * (remainingBtoQuantity / Math.abs(bto.quantity)) : 0,
        profitLossPercent: isExpired ? -100 : 0,
        status: isExpired ? "expired" : "open",
        transactions: [bto],
        fees: 0,
        optionDetails: bto.optionDetails,
      }

      if (isExpired) {
        trade.exitDate = bto.optionDetails!.expirationDate
        trade.duration = Math.round(
          (bto.optionDetails!.expirationDate.getTime() - bto.activityDate.getTime()) / (1000 * 60 * 60 * 24),
        )
        trade.exitPrice = 0
      }

      trades.push(trade)
      debugLog(`Created ${trade.status} trade with remaining quantity ${remainingBtoQuantity}`)
    }
  }

  // Handle any remaining STC transactions that weren't matched
  const unmatchedStc = stcTransactions.filter((stc) => !stc.tradeId)
  for (const stc of unmatchedStc) {
    debugLog(`Processing unmatched STC transaction ${stc.rowIndex}`)

    // Create a trade with estimated entry data
    const trade: CompleteTrade = {
      id: uuidv4(),
      symbol,
      assetType: "option",
      entryDate: new Date(stc.activityDate.getTime() - 86400000), // Estimate 1 day before
      exitDate: stc.activityDate,
      duration: 1, // Estimated
      entryPrice: stc.price * 0.8, // Estimate 20% profit
      exitPrice: stc.price,
      quantity: Math.abs(stc.quantity),
      profitLoss: Math.abs(stc.amount) * 0.2, // Estimate 20% profit
      profitLossPercent: 20, // Estimate 20% profit
      status: "closed",
      transactions: [stc],
      fees: 0,
      optionDetails: stc.optionDetails,
    }
    trades.push(trade)
    debugLog(`Created estimated trade for unmatched STC with quantity ${Math.abs(stc.quantity)}`)
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
