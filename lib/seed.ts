import { getSupabaseServer } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"
import { subDays, format } from "date-fns"

export type SeedOptions = {
  userId: string
  tradeCount?: number
  startDate?: Date
  endDate?: Date
  symbols?: string[]
  includeTags?: boolean
  includePsychology?: boolean
  includeScreenshots?: boolean
}

export async function seedTradeDatabase({
  userId,
  tradeCount = 50,
  startDate = subDays(new Date(), 180),
  endDate = new Date(),
  symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "BTC-USD", "ETH-USD", "EUR-USD"],
  includeTags = true,
  includePsychology = true,
  includeScreenshots = false,
}: SeedOptions): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getSupabaseServer()

    // Setup strategies
    const strategies = [
      "Breakout",
      "Pullback",
      "Trend Following",
      "Reversal",
      "Gap Fill",
      "Momentum",
      "Scalping",
      "Swing",
    ]

    // Setup tags
    const tagNames = [
      { name: "Gap Up", color: "#4ade80" },
      { name: "Gap Down", color: "#f87171" },
      { name: "High Volume", color: "#60a5fa" },
      { name: "Low Volume", color: "#a3a3a3" },
      { name: "Earnings", color: "#c084fc" },
      { name: "News", color: "#facc15" },
      { name: "Premarket", color: "#fb923c" },
      { name: "Fed Day", color: "#e879f9" },
      { name: "First Hour", color: "#2dd4bf" },
      { name: "Power Hour", color: "#f472b6" },
    ]

    // Create tags first
    if (includeTags) {
      const tagIds: string[] = []
      for (const tag of tagNames) {
        const tagId = uuidv4()
        tagIds.push(tagId)

        const { error } = await supabase.from("tags").insert({
          id: tagId,
          name: tag.name,
          color: tag.color,
          user_id: userId,
        })

        if (error) throw new Error(`Error creating tag ${tag.name}: ${error.message}`)
      }
    }

    // Generate trades
    for (let i = 0; i < tradeCount; i++) {
      // Generate random date between start and end
      const timeDiff = endDate.getTime() - startDate.getTime()
      const randomTime = startDate.getTime() + Math.random() * timeDiff
      const tradeDate = new Date(randomTime)

      // Generate random entry parameters
      const symbol = symbols[Math.floor(Math.random() * symbols.length)]
      const direction = Math.random() > 0.5 ? "Long" : "Short"
      const entryPrice = Number.parseFloat((Math.random() * 1000 + 50).toFixed(2))
      const exitDate =
        Math.random() > 0.15
          ? new Date(tradeDate.getTime() + Math.random() * 86400000 * 5)
          : // 0-5 days later
            null // 15% chance of trade still being open

      // Calculate PnL based on entry and exit
      let exitPrice, pnl, status
      const quantity = Math.floor(Math.random() * 100) + 1

      if (exitDate) {
        const isWin = Math.random() > 0.35 // 65% win rate
        // For wins, 1-10% gain, for losses 1-5% loss
        const priceDiff = entryPrice * (isWin ? 0.01 + Math.random() * 0.09 : -(0.01 + Math.random() * 0.04))

        exitPrice = Number.parseFloat(
          (direction === "Long" ? entryPrice + priceDiff : entryPrice - priceDiff).toFixed(2),
        )

        pnl = Number.parseFloat(
          ((direction === "Long" ? exitPrice - entryPrice : entryPrice - exitPrice) * quantity).toFixed(2),
        )

        status = pnl > 0 ? "Win" : pnl < 0 ? "Loss" : "Breakeven"
      } else {
        exitPrice = null
        pnl = null
        status = "Open"
      }

      // Generate trade record
      const tradeId = uuidv4()
      const setup = strategies[Math.floor(Math.random() * strategies.length)]
      const rating =
        status === "Win"
          ? Math.floor(Math.random() * 3) + 3
          : // 3-5 for wins
            Math.floor(Math.random() * 3) + 1 // 1-3 for losses

      const commission = Number.parseFloat((Math.random() * 5).toFixed(2))
      const fees = Number.parseFloat((Math.random() * 1).toFixed(2))

      // Insert trade record
      const { error: tradeError } = await supabase.from("trades").insert({
        id: tradeId,
        user_id: userId,
        symbol,
        direction,
        entry_price: entryPrice,
        exit_price: exitPrice,
        entry_date: format(tradeDate, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        exit_date: exitDate ? format(exitDate, "yyyy-MM-dd'T'HH:mm:ss'Z'") : null,
        quantity,
        pnl,
        status,
        setup,
        rating,
        commission,
        fees,
      })

      if (tradeError) throw new Error(`Error creating trade #${i + 1}: ${tradeError.message}`)

      // Add trade details
      const stopLoss = Number.parseFloat((direction === "Long" ? entryPrice * 0.95 : entryPrice * 1.05).toFixed(2))

      const takeProfit = Number.parseFloat((direction === "Long" ? entryPrice * 1.1 : entryPrice * 0.9).toFixed(2))

      const plannedRisk = Number.parseFloat((Math.abs(entryPrice - stopLoss) * quantity).toFixed(2))
      const plannedReward = Number.parseFloat((Math.abs(takeProfit - entryPrice) * quantity).toFixed(2))

      const actualRisk = plannedRisk
      const actualReward = pnl && pnl > 0 ? pnl : plannedReward * (Math.random() * 0.5 + 0.1)

      const rMultiple = Number.parseFloat((pnl && pnl > 0 ? pnl / plannedRisk : pnl ? pnl / plannedRisk : 0).toFixed(2))

      const { error: detailsError } = await supabase.from("trade_details").insert({
        trade_id: tradeId,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        r_multiple: rMultiple,
        planned_risk: plannedRisk,
        actual_risk: actualRisk,
        planned_reward: plannedReward,
        actual_reward: pnl && pnl > 0 ? pnl : null,
        notes:
          status === "Win"
            ? `Strong ${setup.toLowerCase()} setup with good risk/reward`
            : `Weak ${setup.toLowerCase()} setup that failed at resistance`,
        lessons_learned:
          status === "Win"
            ? "Patience pays off when waiting for confirmation"
            : "Need to wait for stronger confirmation before entry",
        what_went_well: "Proper position sizing and risk management",
        what_to_improve: "Can improve entry timing by waiting for volume confirmation",
      })

      if (detailsError) throw new Error(`Error creating trade details for trade #${i + 1}: ${detailsError.message}`)

      // Add psychology tracking
      if (includePsychology) {
        // Winning trades tend to have better psychology scores
        const confidenceBase = status === "Win" ? 65 : 50
        const focusBase = status === "Win" ? 70 : 55
        const patienceBase = status === "Win" ? 60 : 45

        const { error: psychError } = await supabase.from("psychological_tracking").insert({
          trade_id: tradeId,
          confidence: Math.min(100, Math.max(0, confidenceBase + Math.floor(Math.random() * 30))),
          focus: Math.min(100, Math.max(0, focusBase + Math.floor(Math.random() * 30))),
          patience: Math.min(100, Math.max(0, patienceBase + Math.floor(Math.random() * 30))),
          stress: Math.min(100, Math.max(0, Math.floor(Math.random() * 50) + (status === "Win" ? 0 : 20))),
          fomo: Math.min(100, Math.max(0, Math.floor(Math.random() * 40) + (status === "Win" ? 0 : 25))),
          discipline: Math.min(100, Math.max(0, 60 + Math.floor(Math.random() * 40))),
          sleep_quality: ["Poor", "Fair", "Good", "Excellent"][Math.floor(Math.random() * 4)],
          physical_state: ["Tired", "Average", "Energetic", "Excellent"][Math.floor(Math.random() * 4)],
          environment: ["Noisy", "Some distractions", "Quiet", "Ideal"][Math.floor(Math.random() * 4)],
          distractions: ["Many", "Some", "Few", "None"][Math.floor(Math.random() * 4)],
          decision_making_notes:
            status === "Win"
              ? "Followed trading plan exactly and remained disciplined"
              : "Felt some hesitation before entry, should have waited for better confirmation",
        })

        if (psychError) throw new Error(`Error creating psychological data for trade #${i + 1}: ${psychError.message}`)
      }

      // Add tags
      if (includeTags) {
        // Get existing tags
        const { data: existingTags } = await supabase.from("tags").select("id, name").eq("user_id", userId)

        if (existingTags && existingTags.length > 0) {
          // Add 1-3 random tags to each trade
          const tagCount = Math.floor(Math.random() * 3) + 1
          const shuffledTags = existingTags.sort(() => 0.5 - Math.random())
          const selectedTags = shuffledTags.slice(0, tagCount)

          for (const tag of selectedTags) {
            const { error: tagError } = await supabase.from("trade_tags").insert({
              trade_id: tradeId,
              tag_id: tag.id,
            })

            if (tagError) throw new Error(`Error adding tag to trade #${i + 1}: ${tagError.message}`)
          }
        }
      }

      // Add mistake entries for losing trades
      if (status === "Loss") {
        const mistakeCategories = [
          "Entry Timing",
          "Position Sizing",
          "Stop Loss Placement",
          "Emotional Decision",
          "Analysis Error",
          "Ignored Rules",
        ]

        const mistakeCategory = mistakeCategories[Math.floor(Math.random() * mistakeCategories.length)]
        const mistakeDesc = {
          "Entry Timing": "Entered too early before confirmation",
          "Position Sizing": "Position size too large for the setup quality",
          "Stop Loss Placement": "Stop placed too tight, got stopped out before move",
          "Emotional Decision": "FOMO entry after missing initial move",
          "Analysis Error": "Misinterpreted market structure",
          "Ignored Rules": "Took trade outside of trading plan",
        }[mistakeCategory]

        const actionItem = {
          "Entry Timing": "Wait for volume confirmation before entry",
          "Position Sizing": "Stick to 1% risk per trade maximum",
          "Stop Loss Placement": "Place stops at technical levels, not arbitrary prices",
          "Emotional Decision": "Take a 5 minute break before entering a trade after missing a move",
          "Analysis Error": "Review market structure rules and practice identification",
          "Ignored Rules": "Review trading plan before each session",
        }[mistakeCategory]

        const { error: mistakeError } = await supabase.from("mistakes").insert({
          trade_id: tradeId,
          description: mistakeDesc,
          category: mistakeCategory,
          action_item: actionItem,
        })

        if (mistakeError) throw new Error(`Error adding mistake to trade #${i + 1}: ${mistakeError.message}`)
      }
    }

    return { success: true, message: `Successfully created ${tradeCount} trades for user` }
  } catch (error) {
    console.error("Error seeding database:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during database seeding",
    }
  }
}
