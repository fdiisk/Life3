-- Life3 Database Schema
-- Run this in Supabase SQL Editor to create tables
-- Safe to run multiple times (idempotent)

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table (created first due to foreign key references)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
  last_done TIMESTAMPTZ,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time blocks table
CREATE TABLE IF NOT EXISTS time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type TEXT CHECK (type IN ('work', 'health', 'personal', 'learning', 'social', 'rest')) DEFAULT 'work',
  linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  linked_habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nutrition table
CREATE TABLE IF NOT EXISTS nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  food_name TEXT NOT NULL,
  macros JSONB DEFAULT '{}',
  meal_id UUID,  -- Links to meals table (FK added later after meals exists)
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fitness table
CREATE TABLE IF NOT EXISTS fitness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight DECIMAL,
  cardio_minutes INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Values table (daily value ratings)
CREATE TABLE IF NOT EXISTS values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  daily_rating INTEGER CHECK (daily_rating >= 1 AND daily_rating <= 10),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reflections table
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT CHECK (type IN ('evening', 'weekly', 'monthly', 'gratitude')) DEFAULT 'evening',
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journals table (daily journaling, one entry per day)
CREATE TABLE IF NOT EXISTS journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Improvements table (app feedback with tickboxes and archive)
CREATE TABLE IF NOT EXISTS improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  macro_goals JSONB DEFAULT NULL,
  journal_pin_hash TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_id ON time_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_start ON time_blocks(start_time);
CREATE INDEX IF NOT EXISTS idx_nutrition_user_id ON nutrition(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_meal_id ON nutrition(meal_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_timestamp ON nutrition(timestamp);
CREATE INDEX IF NOT EXISTS idx_fitness_user_id ON fitness(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_timestamp ON fitness(timestamp);
CREATE INDEX IF NOT EXISTS idx_values_user_id ON values(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_date ON journals(date);
CREATE INDEX IF NOT EXISTS idx_improvements_user_id ON improvements(user_id);
CREATE INDEX IF NOT EXISTS idx_improvements_archived ON improvements(archived);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_user_id ON weight(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_timestamp ON weight(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness ENABLE ROW LEVEL SECURITY;
ALTER TABLE values ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Permissive policies (allow all operations - tighten with auth later)
-- Using DO block to avoid "already exists" errors
DO $$
DECLARE
  tables TEXT[] := ARRAY['habits', 'goals', 'tasks', 'time_blocks', 'nutrition', 'fitness', 'values', 'reflections', 'notes', 'journals', 'improvements', 'meals', 'weight', 'user_settings'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = t
      AND policyname = 'Allow all operations on ' || t
    ) THEN
      EXECUTE format('CREATE POLICY "Allow all operations on %I" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
    END IF;
  END LOOP;
END
$$;
