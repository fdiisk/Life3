-- Migration: Add meals table for batch cooking management
-- Date: 2024-12-29
-- Run this if you already have the base tables created

-- Meals table (saved meal templates for batch cooking)
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  portions INTEGER NOT NULL DEFAULT 1,
  total_macros JSONB NOT NULL DEFAULT '{"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);

-- Enable RLS
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Policies (using DO block to avoid "already exists" errors)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meals' AND policyname = 'Allow all operations on meals') THEN
    CREATE POLICY "Allow all operations on meals" ON meals FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;
