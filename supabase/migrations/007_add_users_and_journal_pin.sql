-- Migration: Add users table and journal PIN to user_settings
-- Date: 2024-12-30

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add journal_pin_hash to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS journal_pin_hash TEXT DEFAULT NULL;

-- RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
