export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      trades: {
        Row: {
          id: string
          user_id: string
          symbol: string
          direction: "long" | "short"
          entry_price: number
          exit_price: number | null
          entry_date: string
          exit_date: string | null
          quantity: number
          fees: number
          commission: number
          profit_loss: number | null
          profit_loss_percent: number | null
          status: "open" | "closed" | "cancelled"
          import_source: "manual" | "csv" | "robinhood"
          strategy_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          direction: "long" | "short"
          entry_price: number
          exit_price?: number | null
          entry_date: string
          exit_date?: string | null
          quantity: number
          fees?: number
          commission?: number
          profit_loss?: number | null
          profit_loss_percent?: number | null
          status?: "open" | "closed" | "cancelled"
          import_source?: "manual" | "csv" | "robinhood"
          strategy_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          direction?: "long" | "short"
          entry_price?: number
          exit_price?: number | null
          entry_date?: string
          exit_date?: string | null
          quantity?: number
          fees?: number
          commission?: number
          profit_loss?: number | null
          profit_loss_percent?: number | null
          status?: "open" | "closed" | "cancelled"
          import_source?: "manual" | "csv" | "robinhood"
          strategy_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trade_details: {
        Row: {
          id: string
          trade_id: string
          stop_loss: number | null
          take_profit: number | null
          strategy_id: string | null
          risk_reward_planned: number | null
          risk_reward_actual: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trade_id: string
          stop_loss?: number | null
          take_profit?: number | null
          strategy_id?: string | null
          risk_reward_planned?: number | null
          risk_reward_actual?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trade_id?: string
          stop_loss?: number | null
          take_profit?: number | null
          strategy_id?: string | null
          risk_reward_planned?: number | null
          risk_reward_actual?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trade_psychology: {
        Row: {
          id: string
          trade_id: string
          confidence_level: number | null
          focus_level: number | null
          stress_level: number | null
          fomo_level: number | null
          patience_level: number | null
          discipline_level: number | null
          sleep_quality: string | null
          physical_state: string | null
          environment: string | null
          distractions: string | null
          decision_making_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trade_id: string
          confidence_level?: number | null
          focus_level?: number | null
          stress_level?: number | null
          fomo_level?: number | null
          patience_level?: number | null
          discipline_level?: number | null
          sleep_quality?: string | null
          physical_state?: string | null
          environment?: string | null
          distractions?: string | null
          decision_making_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trade_id?: string
          confidence_level?: number | null
          focus_level?: number | null
          stress_level?: number | null
          fomo_level?: number | null
          patience_level?: number | null
          discipline_level?: number | null
          sleep_quality?: string | null
          physical_state?: string | null
          environment?: string | null
          distractions?: string | null
          decision_making_notes?: string | null
          created_at?: string
        }
      }
      trade_screenshots: {
        Row: {
          id: string
          trade_id: string
          screenshot_url: string
          screenshot_type: "entry" | "exit" | "analysis" | "other"
          created_at: string
        }
        Insert: {
          id?: string
          trade_id: string
          screenshot_url: string
          screenshot_type?: "entry" | "exit" | "analysis" | "other"
          created_at?: string
        }
        Update: {
          id?: string
          trade_id?: string
          screenshot_url?: string
          screenshot_type?: "entry" | "exit" | "analysis" | "other"
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          trading_experience: "beginner" | "intermediate" | "advanced" | "professional" | null
          account_size: number | null
          daily_risk_limit: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          trading_experience?: "beginner" | "intermediate" | "advanced" | "professional" | null
          account_size?: number | null
          daily_risk_limit?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          trading_experience?: "beginner" | "intermediate" | "advanced" | "professional" | null
          account_size?: number | null
          daily_risk_limit?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          default_risk_percentage: number | null
          default_commission: number | null
          theme: string | null
          email_notifications: boolean | null
          default_strategy: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          default_risk_percentage?: number | null
          default_commission?: number | null
          theme?: string | null
          email_notifications?: boolean | null
          default_strategy?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          default_risk_percentage?: number | null
          default_commission?: number | null
          theme?: string | null
          email_notifications?: boolean | null
          default_strategy?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          price_monthly: number
          price_annual: number | null
          trade_limit: number
          ai_query_limit: number | null
          features: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price_monthly: number
          price_annual?: number | null
          trade_limit: number
          ai_query_limit?: number | null
          features: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price_monthly?: number
          price_annual?: number | null
          trade_limit?: number
          ai_query_limit?: number | null
          features?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: "active" | "trialing" | "past_due" | "canceled" | "incomplete"
          is_annual: boolean
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          payment_method_id: string | null
          subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status: "active" | "trialing" | "past_due" | "canceled" | "incomplete"
          is_annual?: boolean
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          payment_method_id?: string | null
          subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: "active" | "trialing" | "past_due" | "canceled" | "incomplete"
          is_annual?: boolean
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          payment_method_id?: string | null
          subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          resource_type: "trades" | "ai_queries" | "storage"
          current_usage: number
          period_start: string
          period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resource_type: "trades" | "ai_queries" | "storage"
          current_usage?: number
          period_start: string
          period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resource_type?: "trades" | "ai_queries" | "storage"
          current_usage?: number
          period_start?: string
          period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      payment_history: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          payment_date: string
          payment_method: string | null
          transaction_id: string | null
          invoice_url: string | null
          description: string | null
          status: "succeeded" | "failed" | "pending" | "refunded"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency?: string
          payment_date: string
          payment_method?: string | null
          transaction_id?: string | null
          invoice_url?: string | null
          description?: string | null
          status: "succeeded" | "failed" | "pending" | "refunded"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          payment_date?: string
          payment_method?: string | null
          transaction_id?: string | null
          invoice_url?: string | null
          description?: string | null
          status?: "succeeded" | "failed" | "pending" | "refunded"
          created_at?: string
        }
      }
      strategies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string
          timeframes: string[] | null
          market_conditions: string[] | null
          setup_image: string | null
          is_active: boolean
          win_rate: number | null
          profit_factor: number | null
          avg_r_multiple: number | null
          usage_count: number | null
          compliance_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category: string
          timeframes?: string[] | null
          market_conditions?: string[] | null
          setup_image?: string | null
          is_active?: boolean
          win_rate?: number | null
          profit_factor?: number | null
          avg_r_multiple?: number | null
          usage_count?: number | null
          compliance_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string
          timeframes?: string[] | null
          market_conditions?: string[] | null
          setup_image?: string | null
          is_active?: boolean
          win_rate?: number | null
          profit_factor?: number | null
          avg_r_multiple?: number | null
          usage_count?: number | null
          compliance_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      rules: {
        Row: {
          id: string
          strategy_id: string
          category: string
          description: string
          priority: number
          is_required: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          strategy_id: string
          category: string
          description: string
          priority?: number
          is_required?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          strategy_id?: string
          category?: string
          description?: string
          priority?: number
          is_required?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      strategy_examples: {
        Row: {
          id: string
          strategy_id: string
          title: string
          description: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          strategy_id: string
          title: string
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          strategy_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trade_strategy_compliance: {
        Row: {
          id: string
          trade_id: string
          strategy_id: string
          compliance_score: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trade_id: string
          strategy_id: string
          compliance_score?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trade_id?: string
          strategy_id?: string
          compliance_score?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rule_compliance: {
        Row: {
          id: string
          trade_strategy_compliance_id: string
          rule_id: string
          was_followed: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trade_strategy_compliance_id: string
          rule_id: string
          was_followed?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trade_strategy_compliance_id?: string
          rule_id?: string
          was_followed?: boolean
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Export specific types for easier usage
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]
export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"]
export type Trade = Database["public"]["Tables"]["trades"]["Row"]
export type TradeDetails = Database["public"]["Tables"]["trade_details"]["Row"]
export type TradePsychology = Database["public"]["Tables"]["trade_psychology"]["Row"]
export type TradeScreenshot = Database["public"]["Tables"]["trade_screenshots"]["Row"]
export type SubscriptionPlan = Database["public"]["Tables"]["subscription_plans"]["Row"]
export type UserSubscription = Database["public"]["Tables"]["user_subscriptions"]["Row"]
export type UsageTracking = Database["public"]["Tables"]["usage_tracking"]["Row"]
export type PaymentHistory = Database["public"]["Tables"]["payment_history"]["Row"]
export type Strategy = Database["public"]["Tables"]["strategies"]["Row"]
export type Rule = Database["public"]["Tables"]["rules"]["Row"]
export type StrategyExample = Database["public"]["Tables"]["strategy_examples"]["Row"]
export type TradeStrategyCompliance = Database["public"]["Tables"]["trade_strategy_compliance"]["Row"]
export type RuleCompliance = Database["public"]["Tables"]["rule_compliance"]["Row"]
