-- Life3 Database - Full Reset Script
-- WARNING: This will DROP all existing data and recreate tables fresh
-- Paste this entire script into Supabase SQL Editor and run

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS time_blocks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS nutrition CASCADE;
DROP TABLE IF EXISTS fitness CASCADE;
DROP TABLE IF EXISTS values CASCADE;
DROP TABLE IF EXISTS reflections CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS journals CASCADE;
DROP TABLE IF EXISTS improvements CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS weight CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Users table (for authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table (created first due to foreign key references)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits table
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
  last_done TIMESTAMPTZ,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time blocks table
CREATE TABLE time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type TEXT CHECK (type IN ('work', 'health', 'personal', 'learning', 'social', 'rest')) DEFAULT 'work',
  linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  linked_habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meals table (saved meal templates for batch cooking)
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  portions INTEGER NOT NULL DEFAULT 1,
  total_macros JSONB NOT NULL DEFAULT '{"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved foods table (user's personal food database)
CREATE TABLE saved_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  macros JSONB NOT NULL DEFAULT '{"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nutrition table
CREATE TABLE nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  food_name TEXT NOT NULL,
  macros JSONB DEFAULT '{}',
  meal_id UUID REFERENCES meals(id) ON DELETE SET NULL,
  saved_food_id UUID REFERENCES saved_foods(id) ON DELETE SET NULL,
  source TEXT CHECK (source IN ('ai', 'saved', 'manual')) DEFAULT 'ai',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fitness table
CREATE TABLE fitness (
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
CREATE TABLE values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  daily_rating INTEGER CHECK (daily_rating >= 1 AND daily_rating <= 10),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reflections table
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT CHECK (type IN ('evening', 'weekly', 'monthly', 'gratitude')) DEFAULT 'evening',
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journals table (daily journaling, one entry per day)
CREATE TABLE journals (
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
CREATE TABLE improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight tracking table
CREATE TABLE weight (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  weight_kg DECIMAL NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  core_values TEXT[] DEFAULT ARRAY['Health', 'Family', 'Career', 'Growth', 'Joy'],
  target_weight_kg DECIMAL,
  macro_goals JSONB DEFAULT NULL,
  journal_pin_hash TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_parent ON goals(parent_goal_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_time_blocks_user_id ON time_blocks(user_id);
CREATE INDEX idx_time_blocks_start ON time_blocks(start_time);
CREATE INDEX idx_saved_foods_user_id ON saved_foods(user_id);
CREATE INDEX idx_nutrition_user_id ON nutrition(user_id);
CREATE INDEX idx_nutrition_meal_id ON nutrition(meal_id);
CREATE INDEX idx_nutrition_saved_food_id ON nutrition(saved_food_id);
CREATE INDEX idx_nutrition_timestamp ON nutrition(timestamp);
CREATE INDEX idx_fitness_user_id ON fitness(user_id);
CREATE INDEX idx_fitness_timestamp ON fitness(timestamp);
CREATE INDEX idx_values_user_id ON values(user_id);
CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_journals_user_id ON journals(user_id);
CREATE INDEX idx_journals_date ON journals(date);
CREATE INDEX idx_improvements_user_id ON improvements(user_id);
CREATE INDEX idx_improvements_archived ON improvements(archived);
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_weight_user_id ON weight(user_id);
CREATE INDEX idx_weight_timestamp ON weight(timestamp);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE saved_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all operations via anon key)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on habits" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on goals" ON goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on time_blocks" ON time_blocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on nutrition" ON nutrition FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on fitness" ON fitness FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on values" ON values FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on reflections" ON reflections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on journals" ON journals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on improvements" ON improvements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on meals" ON meals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on saved_foods" ON saved_foods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on weight" ON weight FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on user_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DONE! All tables created successfully
-- ============================================
