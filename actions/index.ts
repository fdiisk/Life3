'use server'

import * as db from '@/lib/database'
import {
  parseUserInput,
  parseGoals,
  summarizeReflections,
  batchParseInputs,
  reparseIfChanged,
  calculateStreak,
  calculateGoalProgress
} from '@/lib/ai'
import type { Task, Habit, Goal, TimeBlock, Nutrition, Fitness, Value, Reflection, Note, ParsedInput } from '@/lib/types'

// Re-export database functions as server actions
export const getTasks = db.getTasks
export const createTask = db.createTask
export const updateTask = db.updateTask
export const deleteTask = db.deleteTask

export const getHabits = db.getHabits
export const createHabit = db.createHabit
export const updateHabit = db.updateHabit
export const completeHabit = db.completeHabit
export const deleteHabit = db.deleteHabit

export const getGoals = db.getGoals
export const createGoal = db.createGoal
export const updateGoal = db.updateGoal
export const deleteGoal = db.deleteGoal

export const getTimeBlocks = db.getTimeBlocks
export const createTimeBlock = db.createTimeBlock
export const updateTimeBlock = db.updateTimeBlock
export const deleteTimeBlock = db.deleteTimeBlock

export const getNutrition = db.getNutrition
export const createNutrition = db.createNutrition
export const deleteNutrition = db.deleteNutrition

export const getFitness = db.getFitness
export const createFitness = db.createFitness
export const deleteFitness = db.deleteFitness

export const getValues = db.getValues
export const createValue = db.createValue
export const updateValue = db.updateValue

export const getReflections = db.getReflections
export const createReflection = db.createReflection

export const getNotes = db.getNotes
export const createNote = db.createNote
export const deleteNote = db.deleteNote

// AI parsing actions
export async function parseInputAction(input: string) {
  return await parseUserInput(input)
}

export async function parseGoalsAction(input: string) {
  return await parseGoals(input)
}

export async function parseNutritionAction(input: string) {
  const result = await parseUserInput(input)
  return result.nutrition
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
