export interface Strategy {
  id: string
  name: string
  description: string
  category: StrategyCategory
  timeframes: string[]
  marketConditions: string[]
  setupImage: string | null
  isActive: boolean
  winRate: number
  profitFactor: number
  avgRMultiple: number
  usage: number
  complianceScore: number
  rules: Rule[]
  createdAt: Date
  updatedAt: Date
}

export type StrategyCategory =
  | "breakout"
  | "support_resistance"
  | "moving_average"
  | "gap"
  | "pullback"
  | "chart_pattern"
  | "trend_following"
  | "reversal"
  | "volatility"
  | "custom"

export interface Rule {
  id: string
  strategyId: string
  category: RuleCategory
  description: string
  priority: RulePriority
  isRequired: boolean
}

export type RuleCategory = "precondition" | "entry" | "exit" | "management" | "position_sizing"

export type RulePriority = 1 | 2 | 3 // 1: critical, 2: important, 3: optional

export interface StrategyTemplate extends Omit<Strategy, "id" | "createdAt" | "updatedAt"> {
  id: string
}

export interface StrategyPerformance {
  strategyId: string
  winRate: number
  profitFactor: number
  avgRMultiple: number
  totalTrades: number
  complianceScore: number
  profitByCompliance: {
    high: number
    medium: number
    low: number
  }
}
