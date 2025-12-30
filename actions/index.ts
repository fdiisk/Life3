'use server'

import * as db from '@/lib/database'
import {
  parseUserInput,
  parseGoals,
  parseNutrition,
  summarizeReflections,
  batchParseInputs,
  reparseIfChanged,
  calculateStreak,
  calculateGoalProgress
} from '@/lib/ai'
import type { Task, Habit, Goal, TimeBlock, Nutrition, Fitness, Value, Reflection, Note, ParsedInput } from '@/lib/types'

// Wrapped database functions as server actions
export async function getTasks(userId: string, includeCompleted?: boolean) {
  return await db.getTasks(userId, includeCompleted)
}

export async function createTask(task: Parameters<typeof db.createTask>[0]) {
  return await db.createTask(task)
}

export async function updateTask(id: string, updates: Parameters<typeof db.updateTask>[1]) {
  return await db.updateTask(id, updates)
}

export async function deleteTask(id: string) {
  return await db.deleteTask(id)
}

export async function getHabits(userId: string) {
  return await db.getHabits(userId)
}

export async function createHabit(habit: Parameters<typeof db.createHabit>[0]) {
  return await db.createHabit(habit)
}

export async function updateHabit(id: string, updates: Parameters<typeof db.updateHabit>[1]) {
  return await db.updateHabit(id, updates)
}

export async function completeHabit(id: string) {
  return await db.completeHabit(id)
}

export async function deleteHabit(id: string) {
  return await db.deleteHabit(id)
}

export async function getGoals(userId: string) {
  return await db.getGoals(userId)
}

export async function createGoal(goal: Parameters<typeof db.createGoal>[0]) {
  return await db.createGoal(goal)
}

export async function updateGoal(id: string, updates: Parameters<typeof db.updateGoal>[1]) {
  return await db.updateGoal(id, updates)
}

export async function deleteGoal(id: string) {
  return await db.deleteGoal(id)
}

export async function getTimeBlocks(userId: string, date: string) {
  return await db.getTimeBlocks(userId, date)
}

export async function createTimeBlock(block: Parameters<typeof db.createTimeBlock>[0]) {
  return await db.createTimeBlock(block)
}

export async function updateTimeBlock(id: string, updates: Parameters<typeof db.updateTimeBlock>[1]) {
  return await db.updateTimeBlock(id, updates)
}

export async function deleteTimeBlock(id: string) {
  return await db.deleteTimeBlock(id)
}

export async function getNutrition(userId: string, date: string) {
  return await db.getNutrition(userId, date)
}

export async function createNutrition(item: Parameters<typeof db.createNutrition>[0]) {
  return await db.createNutrition(item)
}

export async function deleteNutrition(id: string) {
  return await db.deleteNutrition(id)
}

export async function getFitness(userId: string, date: string) {
  return await db.getFitness(userId, date)
}

export async function createFitness(item: Parameters<typeof db.createFitness>[0]) {
  return await db.createFitness(item)
}

export async function deleteFitness(id: string) {
  return await db.deleteFitness(id)
}

export async function getValues(userId: string, date: string) {
  return await db.getValues(userId, date)
}

export async function createValue(value: Parameters<typeof db.createValue>[0]) {
  return await db.createValue(value)
}

export async function updateValue(id: string, rating: number) {
  return await db.updateValue(id, rating)
}

export async function getReflections(userId: string, limit?: number) {
  return await db.getReflections(userId, limit)
}

export async function createReflection(reflection: Parameters<typeof db.createReflection>[0]) {
  return await db.createReflection(reflection)
}

export async function getNotes(userId: string) {
  return await db.getNotes(userId)
}

export async function createNote(note: Parameters<typeof db.createNote>[0]) {
  return await db.createNote(note)
}

export async function deleteNote(id: string) {
  return await db.deleteNote(id)
}

// AI parsing actions
export async function parseInputAction(input: string) {
  return await parseUserInput(input)
}

export async function parseGoalsAction(input: string) {
  return await parseGoals(input)
}

export async function parseNutritionAction(input: string) {
  // Use dedicated nutrition parser for better accuracy
  return await parseNutrition(input)
}

export async function parseFitnessAction(input: string) {
  const result = await parseUserInput(input)
  return result.fitness
}

export async function getThemeSummary(userId: string) {
  const reflections = await db.getReflections(userId, 20)
  if (reflections.length < 3) return null
  return await summarizeReflections(reflections.map((r) => r.content))
}

// Value management
export async function upsertValue(userId: string, name: string, rating: number) {
  const today = new Date().toISOString().split('T')[0]
  const values = await db.getValues(userId, today)
  const existing = values.find((v) => v.name === name)

  if (existing) {
    return await db.updateValue(existing.id, rating)
  } else {
    return await db.createValue({
      user_id: userId,
      name,
      daily_rating: rating,
      timestamp: new Date().toISOString(),
    })
  }
}

// Batch upsert values - much faster than individual calls
export async function batchUpsertValues(userId: string, ratings: Record<string, number>) {
  const today = new Date().toISOString().split('T')[0]
  const existingValues = await db.getValues(userId, today)
  const existingMap = new Map(existingValues.map(v => [v.name, v]))

  const results = await Promise.all(
    Object.entries(ratings).map(async ([name, rating]) => {
      const existing = existingMap.get(name)
      if (existing) {
        return await db.updateValue(existing.id, rating)
      } else {
        return await db.createValue({
          user_id: userId,
          name,
          daily_rating: rating,
          timestamp: new Date().toISOString(),
        })
      }
    })
  )

  return results
}

// Batch parsing - processes multiple inputs in one API call
export async function batchParseAction(inputs: string[]) {
  return await batchParseInputs(inputs)
}

// Re-parse edited content - only calls AI if content actually changed
export async function reparseEditedAction(
  originalContent: string,
  newContent: string,
  originalParsed: ParsedInput
) {
  return await reparseIfChanged(originalContent, newContent, originalParsed)
}

// Update habit streak after completion
export async function updateHabitStreak(habitId: string) {
  const habit = await db.getHabitById(habitId)
  if (!habit) return null

  const newStreak = calculateStreak(habit.last_done, habit.streak)
  const today = new Date().toISOString().split('T')[0]

  // If completing today, increment streak
  if (habit.last_done !== today) {
    return await db.updateHabit(habitId, {
      streak: newStreak + 1,
      last_done: today,
    })
  }

  return habit
}

// Get goal progress with derived calculations
export async function getGoalWithProgress(goalId: string, userId: string) {
  const [goal, tasks, goals] = await Promise.all([
    db.getGoalById(goalId),
    db.getTasks(userId, false),
    db.getGoals(userId),
  ])

  if (!goal) return null

  const progress = calculateGoalProgress(goalId, tasks, goals)
  return { ...goal, progress }
}

// Bulk update all goal progress for a user
export async function refreshAllGoalProgress(userId: string) {
  const [tasks, goals] = await Promise.all([
    db.getTasks(userId, false),
    db.getGoals(userId),
  ])

  const progressMap: Record<string, number> = {}
  for (const goal of goals) {
    progressMap[goal.id] = calculateGoalProgress(goal.id, tasks, goals)
  }

  return progressMap
}

// Parse and save all items from input in one action
export async function parseAndSaveInput(userId: string, input: string) {
  const parsed = await parseUserInput(input)
  const results: {
    tasks: Task[]
    habits: Habit[]
    nutrition: Nutrition[]
    fitness: Fitness[]
    notes: Note[]
    goals: Goal[]
  } = {
    tasks: [],
    habits: [],
    nutrition: [],
    fitness: [],
    notes: [],
    goals: [],
  }

  const timestamp = new Date().toISOString()
  const today = timestamp.split('T')[0]

  // Save all parsed items (append-only)
  for (const task of parsed.tasks) {
    if (task.title) {
      const created = await db.createTask({
        user_id: userId,
        title: task.title,
        goal_id: task.goal_id || null,
        due_date: task.due_date || today,
        completed: false,
      })
      results.tasks.push(created)
    }
  }

  for (const habit of parsed.habits) {
    if (habit.name) {
      const created = await db.createHabit({
        user_id: userId,
        name: habit.name,
        frequency: habit.frequency || 'daily',
      })
      results.habits.push(created)
    }
  }

  for (const item of parsed.nutrition) {
    if (item.food_name) {
      const created = await db.createNutrition({
        user_id: userId,
        food_name: item.food_name,
        macros: item.macros || {},
        timestamp,
      })
      results.nutrition.push(created)
    }
  }

  for (const item of parsed.fitness) {
    if (item.exercise_name) {
      const created = await db.createFitness({
        user_id: userId,
        exercise_name: item.exercise_name,
        sets: item.sets || null,
        reps: item.reps || null,
        weight: item.weight || null,
        cardio_minutes: item.cardio_minutes || null,
        timestamp,
      })
      results.fitness.push(created)
    }
  }

  for (const note of parsed.notes) {
    if (note.content) {
      const created = await db.createNote({
        user_id: userId,
        content: note.content,
        timestamp,
      })
      results.notes.push(created)
    }
  }

  for (const goal of parsed.goals) {
    if (goal.title) {
      const created = await db.createGoal({
        user_id: userId,
        title: goal.title,
        parent_goal_id: goal.parent_goal_id || null,
        weight: goal.weight || 50,
      })
      results.goals.push(created)
    }
  }

  return results
}

// Derived metrics actions
import {
  getDashboardMetrics,
  detectNewDataPatterns,
  calculatePlannedVsActual,
} from '@/lib/derived-metrics'

export async function getDashboardMetricsAction(userId: string) {
  return await getDashboardMetrics(userId)
}

export async function detectDataPatternsAction(userId: string) {
  return await detectNewDataPatterns(userId)
}

export async function getPlannedVsActualAction(userId: string, date: string) {
  return await calculatePlannedVsActual(userId, date)
}

// AI suggestions actions
import { generateSuggestions, type AISuggestions } from '@/lib/ai-suggestions'

export async function getSuggestionsAction(userId: string): Promise<AISuggestions | null> {
  try {
    const [reflections, values, habits, goals] = await Promise.all([
      db.getReflections(userId, 20),
      db.getValues(userId, new Date().toISOString().split('T')[0]),
      db.getHabits(userId),
      db.getGoals(userId),
    ])

    if (reflections.length < 3 && values.length < 5) {
      return null
    }

    return await generateSuggestions(reflections, values, habits, goals)
  } catch {
    return null
  }
}

// Weight tracking actions
export async function getWeightEntries(userId: string, limit?: number) {
  return await db.getWeightEntries(userId, limit)
}

export async function createWeightEntry(weight: Parameters<typeof db.createWeightEntry>[0]) {
  return await db.createWeightEntry(weight)
}

export async function deleteWeightEntry(id: string) {
  return await db.deleteWeightEntry(id)
}

// User settings actions
export async function getUserSettings(userId: string) {
  return await db.getUserSettings(userId)
}

export async function updateUserSettings(userId: string, settings: Parameters<typeof db.upsertUserSettings>[1]) {
  return await db.upsertUserSettings(userId, settings)
}

// Improvements actions
export async function getImprovements(userId: string, includeArchived?: boolean) {
  return await db.getImprovements(userId, includeArchived)
}

export async function createImprovement(improvement: Parameters<typeof db.createImprovement>[0]) {
  return await db.createImprovement(improvement)
}

export async function updateImprovement(id: string, updates: Parameters<typeof db.updateImprovement>[1]) {
  return await db.updateImprovement(id, updates)
}

export async function deleteImprovement(id: string) {
  return await db.deleteImprovement(id)
}

// Note update action
export async function updateNote(id: string, updates: Parameters<typeof db.updateNote>[1]) {
  return await db.updateNote(id, updates)
}

// Meals actions (batch cooking)
export async function getMeals(userId: string) {
  return await db.getMeals(userId)
}

export async function createMeal(meal: Parameters<typeof db.createMeal>[0]) {
  return await db.createMeal(meal)
}

export async function updateMeal(id: string, updates: Parameters<typeof db.updateMeal>[1]) {
  return await db.updateMeal(id, updates)
}

export async function deleteMeal(id: string) {
  return await db.deleteMeal(id)
}

// Journals actions
export async function getJournal(userId: string, date: string) {
  return await db.getJournal(userId, date)
}

export async function getJournals(userId: string, limit?: number) {
  return await db.getJournals(userId, limit)
}

export async function upsertJournal(journal: Parameters<typeof db.upsertJournal>[0]) {
  return await db.upsertJournal(journal)
}

export async function deleteJournal(id: string) {
  return await db.deleteJournal(id)
}

// Authentication actions
import { hashPassword, verifyPassword, hashPin, verifyPin } from '@/lib/auth'

export async function login(username: string, password: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const user = await db.getUserByUsername(username)
    if (!user) {
      return { success: false, error: 'Invalid username or password' }
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return { success: false, error: 'Invalid username or password' }
    }

    return { success: true, userId: user.id }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

export async function register(username: string, password: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Check if user exists
    const existing = await db.getUserByUsername(username)
    if (existing) {
      return { success: false, error: 'Username already exists' }
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const user = await db.createUser(username, passwordHash)

    return { success: true, userId: user.id }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed' }
  }
}

export async function setJournalPin(userId: string, pin: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!/^\d{6}$/.test(pin)) {
      return { success: false, error: 'PIN must be 6 digits' }
    }

    const pinHash = await hashPin(pin)
    await db.upsertUserSettings(userId, { journal_pin_hash: pinHash })

    return { success: true }
  } catch (error) {
    console.error('Set PIN error:', error)
    return { success: false, error: 'Failed to set PIN' }
  }
}

export async function verifyJournalPin(userId: string, pin: string): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await db.getUserSettings(userId)
    if (!settings?.journal_pin_hash) {
      // No PIN set, allow access
      return { success: true }
    }

    const valid = await verifyPin(pin, settings.journal_pin_hash)
    if (!valid) {
      return { success: false, error: 'Invalid PIN' }
    }

    return { success: true }
  } catch (error) {
    console.error('Verify PIN error:', error)
    return { success: false, error: 'PIN verification failed' }
  }
}

export async function hasJournalPin(userId: string): Promise<boolean> {
  try {
    const settings = await db.getUserSettings(userId)
    return !!settings?.journal_pin_hash
  } catch {
    return false
  }
}
