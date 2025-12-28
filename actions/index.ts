'use server'

import * as db from '@/lib/database'
import { parseUserInput, parseGoals, summarizeReflections } from '@/lib/ai'
import type { Task, Habit, Goal, TimeBlock, Nutrition, Fitness, Value, Reflection, Note } from '@/lib/types'

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
