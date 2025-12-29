-- Migration: Add improvements table for app feedback/suggestions
-- Date: 2024-12-29
-- Run this if you already have the base tables created

-- Improvements table (for app feedback with tickboxes and archive)
CREATE TABLE IF NOT EXISTS improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_improvements_user_id ON improvements(user_id);
CREATE INDEX IF NOT EXISTS idx_improvements_archived ON improvements(archived);

-- Enable RLS
ALTER TABLE improvements ENABLE ROW LEVEL SECURITY;

-- Policies (using DO block to avoid "already exists" errors)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'improvements' AND policyname = 'Allow all operations on improvements') THEN
    CREATE POLICY "Allow all operations on improvements" ON improvements FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;
