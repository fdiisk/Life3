-- Migration: Add weight tracking and user settings tables
-- Date: 2024-12-29
-- Run this if you already have the base tables created

-- Weight tracking table
CREATE TABLE IF NOT EXISTS weight (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  weight_kg DECIMAL NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  core_values TEXT[] DEFAULT ARRAY['Health', 'Family', 'Career', 'Growth', 'Joy'],
  target_weight_kg DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weight_user_id ON weight(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_timestamp ON weight(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS
ALTER TABLE weight ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies (using DO block to avoid "already exists" errors)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weight' AND policyname = 'Allow all operations on weight') THEN
    CREATE POLICY "Allow all operations on weight" ON weight FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Allow all operations on user_settings') THEN
    CREATE POLICY "Allow all operations on user_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;
