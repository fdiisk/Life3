'use server'

import { createServerClient } from './supabase/server'
import type {
  Task, Habit, Goal, TimeBlock, Nutrition, Fitness, Value, Reflection, Note, Weight, UserSettings
} from './types'

// Tasks
export async function getTasks(userId: string, includeCompleted = false) {
  const supabase = createServerClient()
  let query = supabase.from('tasks').select('*').eq('user_id', userId)
  if (!includeCompleted) {
    query = query.eq('completed', false)
  }
  const { data, error } = await query.order('due_date', { ascending: true })
  if (error) throw error
  return data as Task[]
}

export async function createTask(task: Omit<Task, 'id' | 'created_at'>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('tasks').insert(task).select().single()
  if (error) throw error
  return data as Task
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Task
}

export async function deleteTask(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// Habits
export async function getHabits(userId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('habits').select('*').eq('user_id', userId)
  if (error) throw error
  return data as Habit[]
}

export async function getHabitById(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('habits').select('*').eq('id', id).single()
  if (error) return null
  return data as Habit
}

export async function createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'streak' | 'last_done'>) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...habit, streak: 0, last_done: null })
    .select()
    .single()
  if (error) throw error
  return data as Habit
}

export async function updateHabit(id: string, updates: Partial<Habit>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('habits').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Habit
}

export async function completeHabit(id: string) {
  const supabase = createServerClient()
  const { data: habit } = await supabase.from('habits').select('*').eq('id', id).single()
  if (!habit) throw new Error('Habit not found')

  const today = new Date().toISOString().split('T')[0]
  const lastDone = habit.last_done ? new Date(habit.last_done).toISOString().split('T')[0] : null
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let newStreak = habit.streak
  if (lastDone === yesterday) {
    newStreak += 1
  } else if (lastDone !== today) {
    newStreak = 1
  }

  const { data, error } = await supabase
    .from('habits')
    .update({ last_done: new Date().toISOString(), streak: newStreak })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Habit
}

export async function deleteHabit(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw error
}

// Goals
export async function getGoals(userId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId)
  if (error) throw error
  return data as Goal[]
}

export async function getGoalById(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('goals').select('*').eq('id', id).single()
  if (error) return null
  return data as Goal
}

export async function createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'completed'>) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('goals')
    .insert({ ...goal, completed: false })
    .select()
    .single()
  if (error) throw error
  return data as Goal
}

export async function updateGoal(id: string, updates: Partial<Goal>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('goals').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Goal
}

export async function deleteGoal(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw error
}

// Time Blocks
export async function getTimeBlocks(userId: string, date: string) {
  const supabase = createServerClient()
  const startOfDay = `${date}T00:00:00`
  const endOfDay = `${date}T23:59:59`
  const { data, error } = await supabase
    .from('time_blocks')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time', { ascending: true })
  if (error) throw error
  return data as TimeBlock[]
}

export async function createTimeBlock(block: Omit<TimeBlock, 'id' | 'created_at'>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('time_blocks').insert(block).select().single()
  if (error) throw error
  return data as TimeBlock
}

export async function updateTimeBlock(id: string, updates: Partial<TimeBlock>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('time_blocks').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as TimeBlock
}

export async function deleteTimeBlock(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('time_blocks').delete().eq('id', id)
  if (error) throw error
}

// Nutrition
export async function getNutrition(userId: string, date: string) {
  const supabase = createServerClient()
  const startOfDay = `${date}T00:00:00`
  const endOfDay = `${date}T23:59:59`
  const { data, error } = await supabase
    .from('nutrition')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', startOfDay)
    .lte('timestamp', endOfDay)
    .order('timestamp', { ascending: true })
  if (error) throw error
  return data as Nutrition[]
}

export async function createNutrition(nutrition: Omit<Nutrition, 'id' | 'created_at'>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('nutrition').insert(nutrition).select().single()
  if (error) throw error
  return data as Nutrition
}

export async function deleteNutrition(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('nutrition').delete().eq('id', id)
  if (error) throw error
}

// Fitness
export async function getFitness(userId: string, date: string) {
  const supabase = createServerClient()
  const startOfDay = `${date}T00:00:00`
  const endOfDay = `${date}T23:59:59`
  const { data, error } = await supabase
    .from('fitness')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', startOfDay)
    .lte('timestamp', endOfDay)
    .order('timestamp', { ascending: true })
  if (error) throw error
  return data as Fitness[]
}

export async function createFitness(fitness: Omit<Fitness, 'id' | 'created_at'>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('fitness').insert(fitness).select().single()
  if (error) throw error
  return data as Fitness
}

export async function deleteFitness(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('fitness').delete().eq('id', id)
  if (error) throw error
}

// Values
export async function getValues(userId: string, date: string) {
  const supabase = createServerClient()
  const startOfDay = `${date}T00:00:00`
  const endOfDay = `${date}T23:59:59`
  const { data, error } = await supabase
    .from('values')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', startOfDay)
    .lte('timestamp', endOfDay)
  if (error) throw error
  return data as Value[]
}

export async function createValue(value: Omit<Value, 'id' | 'created_at'>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('values').insert(value).select().single()
  if (error) throw error
  return data as Value
}

export async function updateValue(id: string, rating: number) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('values')
    .update({ daily_rating: rating })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Value
}

// Reflections
export async function getReflections(userId: string, limit = 10) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as Reflection[]
}

export async function createReflection(reflection: Omit<Reflection, 'id' | 'created_at'>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('reflections').insert(reflection).select().single()
  if (error) throw error
  return data as Reflection
}

// Notes
export async function getNotes(userId: string, limit = 20) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as Note[]
}

export async function createNote(note: Omit<Note, 'id' | 'created_at'>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('notes').insert(note).select().single()
  if (error) throw error
  return data as Note
}

export async function deleteNote(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

// Weight tracking
export async function getWeightEntries(userId: string, limit = 30) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('weight')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as Weight[]
}

export async function createWeightEntry(weight: Omit<Weight, 'id' | 'created_at'>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('weight').insert(weight).select().single()
  if (error) throw error
  return data as Weight
}

export async function deleteWeightEntry(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('weight').delete().eq('id', id)
  if (error) throw error
}

// User Settings
export async function getUserSettings(userId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data as UserSettings | null
}

export async function upsertUserSettings(userId: string, settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data as UserSettings
}
