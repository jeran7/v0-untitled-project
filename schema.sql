-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trade table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('Long', 'Short')),
  entry_price DECIMAL(18,2) NOT NULL,
  exit_price DECIMAL(18,2),
  entry_date TIMESTAMPTZ NOT NULL,
  exit_date TIMESTAMPTZ,
  quantity DECIMAL(18,4) NOT NULL,
  pnl DECIMAL(18,2),
  status TEXT CHECK (status IN ('Win', 'Loss', 'Breakeven', 'Open')) DEFAULT 'Open',
  setup TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  commission DECIMAL(18,2),
  fees DECIMAL(18,2)
);

-- Trade details table
CREATE TABLE trade_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  stop_loss DECIMAL(18,2),
  take_profit DECIMAL(18,2),
  r_multiple DECIMAL(10,2),
  planned_risk DECIMAL(18,2),
  actual_risk DECIMAL(18,2),
  planned_reward DECIMAL(18,2),
  actual_reward DECIMAL(18,2),
  notes TEXT,
  lessons_learned TEXT,
  what_went_well TEXT,
  what_to_improve TEXT
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT,
  user_id UUID NOT NULL
);

-- Junction table for trades and tags
CREATE TABLE trade_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(trade_id, tag_id)
);

-- Psychological tracking table
CREATE TABLE psychological_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  focus INTEGER CHECK (focus >= 0 AND focus <= 100),
  patience INTEGER CHECK (patience >= 0 AND patience <= 100),
  stress INTEGER CHECK (stress >= 0 AND stress <= 100),
  fomo INTEGER CHECK (fomo >= 0 AND fomo <= 100),
  discipline INTEGER CHECK (discipline >= 0 AND discipline <= 100),
  sleep_quality TEXT,
  physical_state TEXT,
  environment TEXT,
  distractions TEXT,
  decision_making_notes TEXT
);

-- Trade screenshots
CREATE TABLE trade_screenshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL CHECK (type IN ('screenshot', 'chart', 'annotation'))
);

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  account_balance DECIMAL(18,2),
  account_currency TEXT DEFAULT 'USD',
  settings JSONB
);

-- Mistakes table for trade mistakes
CREATE TABLE mistakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT,
  action_item TEXT
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Trades table policies
CREATE POLICY trades_select_policy ON trades
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY trades_insert_policy ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY trades_update_policy ON trades
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY trades_delete_policy ON trades
  FOR DELETE USING (auth.uid() = user_id);

-- Trade details table policies (based on trade ownership)
CREATE POLICY trade_details_select_policy ON trade_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_details.trade_id
      AND trades.user_id = auth.uid()
    )
  );
  
CREATE POLICY trade_details_insert_policy ON trade_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_details.trade_id
      AND trades.user_id = auth.uid()
    )
  );
  
CREATE POLICY trade_details_update_policy ON trade_details
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_details.trade_id
      AND trades.user_id = auth.uid()
    )
  );
  
CREATE POLICY trade_details_delete_policy ON trade_details
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_details.trade_id
      AND trades.user_id = auth.uid()
    )
  );

-- Similar policies for other tables...

-- Tags table policies
CREATE POLICY tags_select_policy ON tags
  FOR SELECT USING (auth.uid() = user_id);

-- User profiles policy
CREATE POLICY profiles_select_policy ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY profiles_insert_policy ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY profiles_update_policy ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
