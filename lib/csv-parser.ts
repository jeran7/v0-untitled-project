import Papa from "papaparse"
import type { RawTransaction, ProcessedTransaction, TransactionType } from "@/types/import"

export async function parseCSV(file: File): Promise<RawTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      encoding: "UTF-8",
      // Add this option to prevent errors with varying column counts
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error}`))
      },
      complete: (results) => {
        try {
          // Instead, log warnings but continue processing
          if (results.errors && results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors)
          }

          // Get the headers from the parsed file
          const headers = results.meta.fields || []

          // Check if this is a Robinhood CSV by looking for common headers
          // We'll be flexible with header names since Robinhood changes them sometimes
          const isRobinhoodFormat =
            headers.some((h) => /activity\s*date|transaction\s*date|date/i.test(h)) &&
            headers.some((h) => /description|details/i.test(h)) &&
            headers.some((h) => /amount|value|debit|credit/i.test(h))

          if (!isRobinhoodFormat) {
            throw new Error(
              "This doesn't appear to be a valid Robinhood transaction CSV. Please check the file format.",
            )
          }

          // Map header variations to our standard names
          const headerMap = createHeaderMap(headers)

          const transactions: RawTransaction[] = results.data
            .filter((row: any) => {
              // Filter out empty rows or rows with no meaningful data
              return Object.values(row).some((value) => value !== null && value !== undefined && value !== "")
            })
            .map((row: any, index: number) => {
              try {
                // Use the header map to extract data with flexible column names
                const activityDate = new Date(row[headerMap.activityDate] || new Date())
                const processDate = new Date(row[headerMap.processDate] || row[headerMap.activityDate] || new Date())
                const settleDate = new Date(
                  row[headerMap.settleDate] || row[headerMap.processDate] || row[headerMap.activityDate] || new Date(),
                )

                // Extract other fields
                const instrument = row[headerMap.instrument] || ""
                const description = row[headerMap.description] || ""

                // Handle transaction code/type with flexible mapping
                const transCodeRaw = row[headerMap.transCode] || ""
                const transCode = mapTransactionType(transCodeRaw, description)

                // Handle quantity with flexible mapping
                let quantity = 0
                if (headerMap.quantity && row[headerMap.quantity] !== undefined) {
                  quantity = Number.parseFloat(row[headerMap.quantity].toString().replace(/,/g, "")) || 0
                }

                // Handle price with flexible mapping
                let price = 0
                if (headerMap.price && row[headerMap.price] !== undefined) {
                  price = Number.parseFloat(row[headerMap.price].toString().replace(/[$,]/g, "")) || 0
                }

                // Handle amount with flexible mapping
                let amount = 0
                if (headerMap.amount && row[headerMap.amount] !== undefined) {
                  amount = Number.parseFloat(row[headerMap.amount].toString().replace(/[$,]/g, "")) || 0
                }

                return {
                  activityDate,
                  processDate,
                  settleDate,
                  instrument,
                  description,
                  transCode,
                  quantity,
                  price,
                  amount,
                  rowIndex: index,
                }
              } catch (err) {
                console.warn(`Error processing row ${index}:`, err, row)
                // Return a placeholder for problematic rows
                return {
                  activityDate: new Date(),
                  processDate: new Date(),
                  settleDate: new Date(),
                  instrument: "ERROR",
                  description: `Error processing row ${index}`,
                  transCode: "OTHER" as TransactionType,
                  quantity: 0,
                  price: 0,
                  amount: 0,
                  rowIndex: index,
                }
              }
            })

          resolve(transactions)
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error}`))
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error}`))
      },
    })
  })
}

// Create a mapping from the actual CSV headers to our standard field names
function createHeaderMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {}

  // Map for activity date
  const activityDateVariations = ["Activity Date", "Date", "Transaction Date", "Trade Date"]
  map.activityDate = findMatchingHeader(headers, activityDateVariations)

  // Map for process date
  const processDateVariations = ["Process Date", "Executed", "Execution Date"]
  map.processDate = findMatchingHeader(headers, processDateVariations)

  // Map for settle date
  const settleDateVariations = ["Settle Date", "Settlement Date"]
  map.settleDate = findMatchingHeader(headers, settleDateVariations)

  // Map for instrument/symbol
  const instrumentVariations = ["Instrument", "Symbol", "Ticker", "Instrument Name"]
  map.instrument = findMatchingHeader(headers, instrumentVariations)

  // Map for description
  const descriptionVariations = ["Description", "Details", "Transaction", "Activity"]
  map.description = findMatchingHeader(headers, descriptionVariations)

  // Map for transaction code
  const transCodeVariations = ["Trans Code", "Transaction Type", "Type", "Action"]
  map.transCode = findMatchingHeader(headers, transCodeVariations)

  // Map for quantity
  const quantityVariations = ["Quantity", "Shares", "Amount", "Qty", "Quantity of Shares"]
  map.quantity = findMatchingHeader(headers, quantityVariations)

  // Map for price
  const priceVariations = ["Price", "Price/Share", "Share Price", "Avg Price", "Average Price"]
  map.price = findMatchingHeader(headers, priceVariations)

  // Map for amount
  const amountVariations = ["Amount", "Total", "Value", "Debit", "Credit", "Net Amount"]
  map.amount = findMatchingHeader(headers, amountVariations)

  return map
}

// Find a matching header from a list of variations
function findMatchingHeader(headers: string[], variations: string[]): string {
  for (const variation of variations) {
    const match = headers.find((h) => h.toLowerCase() === variation.toLowerCase())
    if (match) return match
  }

  // Try partial matches if exact match not found
  for (const variation of variations) {
    const match = headers.find((h) => h.toLowerCase().includes(variation.toLowerCase()))
    if (match) return match
  }

  return ""
}

export function processTransactions(rawTransactions: RawTransaction[]): ProcessedTransaction[] {
  return rawTransactions.map((transaction) => {
    // Extract symbol from instrument or description
    let symbol = transaction.instrument
    let assetType: "stock" | "option" | "cash" | "unknown" = "unknown"
    let optionDetails
    let isRecurring = false

    // If no symbol but we have a description, try to extract symbol from description
    if (!symbol && transaction.description) {
      // Try to extract symbol from description patterns like "AAPL Buy" or "Bought AAPL"
      const symbolMatch = transaction.description.match(/\b([A-Z]{1,5})\b/)
      if (symbolMatch) {
        symbol = symbolMatch[1]
      }
    }

    // Determine asset type and extract details
    if (symbol && symbol.length > 0) {
      // Check for option transactions first - look for specific patterns in description
      if (
        transaction.description.includes("Option") ||
        transaction.description.includes("Call") ||
        transaction.description.includes("Put") ||
        // Look for strike price patterns
        /\$\d+(\.\d+)?/.test(transaction.description) ||
        // Look for expiration date patterns
        /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(transaction.description)
      ) {
        assetType = "option"
        // Extract option details from description
        optionDetails = extractOptionDetails(transaction.description, symbol)

        // If we couldn't extract option details but we're confident it's an option
        if (!optionDetails && transaction.description.toLowerCase().includes("put")) {
          // Try to extract from the description directly
          const strikeMatch = transaction.description.match(/\$(\d+(\.\d+)?)/)
          const dateMatch = transaction.description.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)

          if (strikeMatch && dateMatch) {
            const strikePrice = Number.parseFloat(strikeMatch[1])
            let year = Number.parseInt(dateMatch[3])
            if (year < 100) year += 2000
            const month = Number.parseInt(dateMatch[1]) - 1
            const day = Number.parseInt(dateMatch[2])

            optionDetails = {
              strikePrice,
              expirationDate: new Date(year, month, day),
              optionType: transaction.description.toLowerCase().includes("call") ? "call" : "put",
            }
          }
        }
      } else {
        assetType = "stock"
        // Check if it's a recurring purchase
        isRecurring =
          transaction.description.toLowerCase().includes("recurring") ||
          transaction.description.toLowerCase().includes("dividend reinvestment")
      }
    } else {
      // It's likely a cash transaction
      assetType = "cash"
      // Try to extract symbol from description for dividends
      if (transaction.transCode === "CDIV" || transaction.description.toLowerCase().includes("dividend")) {
        const dividendMatch = transaction.description.match(/dividend\s+(?:from|for)?\s+([A-Z]+)/i)
        if (dividendMatch) {
          symbol = dividendMatch[1]
        }
      }
    }

    // Determine transaction type for options more accurately
    let transCode = transaction.transCode
    if (assetType === "option") {
      const desc = transaction.description.toLowerCase()
      if ((transCode === "Buy" || desc.includes("buy")) && !desc.includes("sell")) {
        transCode = "BTO" // Buy to Open
      } else if ((transCode === "Sell" || desc.includes("sell")) && !desc.includes("buy")) {
        transCode = "STC" // Sell to Close
      }
    }

    return {
      ...transaction,
      symbol,
      assetType,
      optionDetails,
      isRecurring,
      transCode,
    }
  })
}

function extractOptionDetails(
  description: string,
  symbol: string,
): { strikePrice: number; expirationDate: Date; optionType: "call" | "put" } | undefined {
  try {
    // Try multiple regex patterns to handle different description formats

    // Pattern 1: "XYZ $150 Call 01/21/22"
    let optionRegex = /\$?(\d+(?:\.\d+)?)?\s+(Call|Put)\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i
    let match = description.match(optionRegex)

    if (!match) {
      // Pattern 2: "Call XYZ 01/21/22 $150"
      optionRegex = /(Call|Put)\s+[A-Z]+\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+\$?(\d+(?:\.\d+)?)/i
      match = description.match(optionRegex)

      if (match) {
        // Rearrange the match groups to match pattern 1
        match = [
          match[0],
          match[5], // Strike price
          match[1], // Option type
          match[2], // Month
          match[3], // Day
          match[4], // Year
        ]
      }
    }

    if (!match) {
      // Pattern 3: "XYZ 01/21/22 $150 Call"
      optionRegex = /[A-Z]+\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+\$?(\d+(?:\.\d+)?)\s+(Call|Put)/i
      match = description.match(optionRegex)

      if (match) {
        // Rearrange the match groups to match pattern 1
        match = [
          match[0],
          match[4], // Strike price
          match[5], // Option type
          match[1], // Month
          match[2], // Day
          match[3], // Year
        ]
      }
    }

    // Pattern 4: "SPY 4/30/2025 Put $548.00"
    if (!match) {
      optionRegex = /([A-Z]+)\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(Call|Put)\s+\$?(\d+(?:\.\d+)?)/i
      match = description.match(optionRegex)

      if (match) {
        // Rearrange the match groups to match pattern 1
        match = [
          match[0],
          match[6], // Strike price
          match[5], // Option type
          match[2], // Month
          match[3], // Day
          match[4], // Year
        ]
      }
    }

    if (match) {
      const strikePrice = Number.parseFloat(match[1])
      const optionType = match[2].toLowerCase() as "call" | "put"

      // Parse date - handle both MM/DD/YY and MM/DD/YYYY formats
      let year = Number.parseInt(match[5])
      if (year < 100) year += 2000 // Assume 20xx for two-digit years
      const month = Number.parseInt(match[3]) - 1 // JavaScript months are 0-indexed
      const day = Number.parseInt(match[4])

      const expirationDate = new Date(year, month, day)

      return {
        strikePrice,
        expirationDate,
        optionType,
      }
    }

    return undefined
  } catch (error) {
    console.error("Failed to extract option details:", error)
    return undefined
  }
}

function mapTransactionType(transCode: string, description: string): TransactionType {
  // Map transaction codes to our standardized types
  if (!transCode) {
    // Try to infer from description
    const desc = description.toLowerCase()
    if (desc.includes("buy to open") || desc.includes("bought to open")) return "BTO"
    if (desc.includes("sell to close") || desc.includes("sold to close")) return "STC"
    if (desc.includes("buy") || desc.includes("bought") || desc.includes("purchase")) return "Buy"
    if (desc.includes("sell") || desc.includes("sold") || desc.includes("sale")) return "Sell"
    if (desc.includes("dividend")) return "CDIV"
    if (desc.includes("fee") || desc.includes("commission")) return "AFEE"
    if (desc.includes("option expiration") || desc.includes("expired")) return "OEXP"
    if (
      desc.includes("ach deposit") ||
      desc.includes("transfer") ||
      desc.includes("deposit") ||
      desc.includes("withdrawal")
    )
      return "ACH"
    if (desc.includes("interest")) return "INT"
    return "OTHER"
  }

  // Normalize transaction codes
  const code = transCode.toUpperCase().trim()

  // Common mappings
  const buyMappings = ["BUY", "PURCHASE", "BOUGHT", "BUY TO OPEN", "BTO"]
  const sellMappings = ["SELL", "SALE", "SOLD", "SELL TO CLOSE", "STC"]
  const dividendMappings = ["DIV", "DIVIDEND", "CDIV"]
  const feeMappings = ["FEE", "COMMISSION", "AFEE"]
  const expirationMappings = ["EXP", "EXPIRE", "EXPIRATION", "OEXP"]
  const transferMappings = ["TRANSFER", "DEPOSIT", "WITHDRAWAL", "ACH"]
  const interestMappings = ["INT", "INTEREST"]

  if (buyMappings.includes(code)) {
    return description.toLowerCase().includes("option") ? "BTO" : "Buy"
  }

  if (sellMappings.includes(code)) {
    return description.toLowerCase().includes("option") ? "STC" : "Sell"
  }

  if (dividendMappings.includes(code)) return "CDIV"
  if (feeMappings.includes(code)) return "AFEE"
  if (expirationMappings.includes(code)) return "OEXP"
  if (transferMappings.includes(code)) return "ACH"
  if (interestMappings.includes(code)) return "INT"

  // Return as is if it's already one of our types
  if (["BTO", "STC", "Buy", "Sell", "CDIV", "AFEE", "OEXP", "SLIP", "INT", "DCF", "RTP", "ACH"].includes(code)) {
    return code as TransactionType
  }

  return "OTHER"
}
