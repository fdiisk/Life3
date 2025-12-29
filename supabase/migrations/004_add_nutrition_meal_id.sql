-- Migration: Add meal_id column to nutrition table
-- Date: 2024-12-29
-- Links nutrition entries to saved meals

-- Add meal_id column to nutrition table (without FK for compatibility)
ALTER TABLE nutrition ADD COLUMN IF NOT EXISTS meal_id UUID;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_nutrition_meal_id ON nutrition(meal_id);
