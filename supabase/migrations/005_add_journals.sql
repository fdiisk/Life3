-- Migration: Add journals table for daily journaling
-- Date: 2024-12-29

-- Journals table (one entry per day)
CREATE TABLE IF NOT EXISTS journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,  -- One entry per day per user
  content TEXT NOT NULL DEFAULT '',
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)  -- Ensures one journal per day per user
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_date ON journals(date);

-- Enable RLS
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journals' AND policyname = 'Allow all operations on journals') THEN
    CREATE POLICY "Allow all operations on journals" ON journals FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;
