-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  timeframes TEXT[] DEFAULT '{}',
  market_conditions TEXT[] DEFAULT '{}',
  setup_image TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  win_rate NUMERIC(5,2) DEFAULT 0,
  profit_factor NUMERIC(10,2) DEFAULT 0,
  avg_r_multiple NUMERIC(10,2) DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  compliance_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 2,
  is_required BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strategy examples table
CREATE TABLE IF NOT EXISTS strategy_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trade strategy compliance table
CREATE TABLE IF NOT EXISTS trade_strategy_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  compliance_score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trade_id, strategy_id)
);

-- Rule compliance table
CREATE TABLE IF NOT EXISTS rule_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_strategy_compliance_id UUID NOT NULL REFERENCES trade_strategy_compliance(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
  was_followed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trade_strategy_compliance_id, rule_id)
);

-- Add strategy_id to trades table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trades' AND column_name = 'strategy_id'
  ) THEN
    ALTER TABLE trades ADD COLUMN strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Row Level Security
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_strategy_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_compliance ENABLE ROW LEVEL SECURITY;

-- Policies for strategies
CREATE POLICY strategies_select_policy ON strategies
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY strategies_insert_policy ON strategies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY strategies_update_policy ON strategies
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY strategies_delete_policy ON strategies
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for rules (based on strategy ownership)
CREATE POLICY rules_select_policy ON rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM strategies
      WHERE strategies.id = rules.strategy_id
      AND strategies.user_id = auth.uid()
    )
  );
  
CREATE POLICY rules_insert_policy ON rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM strategies
      WHERE strategies.id = rules.strategy_id
      AND strategies.user_id = auth.uid()
    )
  );
  
CREATE POLICY rules_update_policy ON rules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM strategies
      WHERE strategies.id = rules.strategy_id
      AND strategies.user_id = auth.uid()
    )
  );
  
CREATE POLICY rules_delete_policy ON rules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM strategies
      WHERE strategies.id = rules.strategy_id
      AND strategies.user_id = auth.uid()
    )
  );

-- Similar policies for other tables
CREATE POLICY strategy_examples_select_policy ON strategy_examples
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM strategies
      WHERE strategies.id = strategy_examples.strategy_id
      AND strategies.user_id = auth.uid()
    )
  );

CREATE POLICY trade_strategy_compliance_select_policy ON trade_strategy_compliance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_strategy_compliance.trade_id
      AND trades.user_id = auth.uid()
    )
  );

CREATE POLICY rule_compliance_select_policy ON rule_compliance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trade_strategy_compliance tsc
      JOIN trades t ON t.id = tsc.trade_id
      WHERE tsc.id = rule_compliance.trade_strategy_compliance_id
      AND t.user_id = auth.uid()
    )
  );
