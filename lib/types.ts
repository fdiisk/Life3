export interface User {
  id: string
  created_at: string
  updated_at: string
  name: string
  email: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  last_done: string | null
  streak: number
  created_at?: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  parent_goal_id: string | null
  weight: number
  completed: boolean
  created_at?: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  goal_id: string | null
  due_date: string | null
  completed: boolean
  created_at?: string
}

export interface TimeBlock {
  id: string
  user_id: string
  start_time: string
  end_time: string
  type: 'work' | 'health' | 'personal' | 'learning' | 'social' | 'rest'
  linked_task_id: string | null
  linked_habit_id: string | null
  created_at?: string
}

export interface Nutrition {
  id: string
  user_id: string
  food_name: string
  macros: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
  }
  timestamp: string
  created_at?: string
}

export interface Fitness {
  id: string
  user_id: string
  exercise_name: string
  sets: number | null
  reps: number | null
  weight: number | null
  cardio_minutes: number | null
  timestamp: string
  created_at?: string
}

export interface Value {
  id: string
  user_id: string
  name: string
  daily_rating: number
  timestamp: string
  created_at?: string
}

export interface Reflection {
  id: string
  user_id: string
  type: 'evening' | 'weekly' | 'monthly' | 'gratitude'
  content: string
  timestamp: string
  created_at?: string
}

export interface Note {
  id: string
  user_id: string
  content: string
  timestamp: string
  created_at?: string
}

// AI Parsing Types
export interface ParsedInput {
  tasks: Partial<Task>[]
  habits: Partial<Habit>[]
  nutrition: Partial<Nutrition>[]
  fitness: Partial<Fitness>[]
  notes: Partial<Note>[]
  goals: Partial<Goal>[]
}

// Specific return type for parseGoals
export interface ParsedGoalsResult {
  goals: Partial<Goal>[]
  tasks: { title: string; goal_index: number }[]
  habits: { name: string; frequency: string; goal_index: number }[]
}

export type LifeArea = TimeBlock['type']

export const LIFE_AREA_COLORS: Record<LifeArea, string> = {
  work: 'bg-blue-500',
  health: 'bg-green-500',
  personal: 'bg-purple-500',
  learning: 'bg-yellow-500',
  social: 'bg-pink-500',
  rest: 'bg-gray-500',
}
