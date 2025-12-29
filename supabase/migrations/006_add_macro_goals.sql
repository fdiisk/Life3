-- Migration: Add macro_goals column to user_settings table
-- Date: 2024-12-29
-- Stores daily macro targets (calories, protein, carbs, fat, fiber)

-- Add macro_goals column as JSONB
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS macro_goals JSONB DEFAULT NULL;
