'use server'

import { parseUserInput } from '@/lib/ai'
import { createTask, createHabit, createGoal, createNote } from '@/lib/database'
import { createNutrition, createFitness } from '@/lib/database'
import type { ParsedInput } from '@/lib/types'

export async function parseInput(input: string): Promise<ParsedInput> {
  return await parseUserInput(input)
}

export async function saveParsedInput(userId: string, parsed: ParsedInput) {
  const results = {
    tasks: [] as string[],
    habits: [] as string[],
    goals: [] as string[],
    nutrition: [] as string[],
    fitness: [] as string[],
    notes: [] as string[],
  }

  const timestamp = new Date().toISOString()

  // Save tasks
  for (const task of parsed.tasks) {
    if (task.title) {
      const created = await createTask({
        user_id: userId,
        title: task.title,
        goal_id: task.goal_id || null,
        due_date: task.due_date || null,
        completed: false,
      })
      results.tasks.push(created.id)
    }
  }

  // Save habits
  for (const habit of parsed.habits) {
    if (habit.name) {
      const created = await createHabit({
        user_id: userId,
        name: habit.name,
        frequency: habit.frequency || 'daily',
      })
      results.habits.push(created.id)
    }
  }

  // Save goals
  for (const goal of parsed.goals) {
    if (goal.title) {
      const created = await createGoal({
        user_id: userId,
        title: goal.title,
        parent_goal_id: goal.parent_goal_id || null,
        weight: goal.weight || 50,
      })
      results.goals.push(created.id)
    }
  }

  // Save nutrition
  for (const item of parsed.nutrition) {
    if (item.food_name) {
      const created = await createNutrition({
        user_id: userId,
        food_name: item.food_name,
        macros: item.macros || {},
        timestamp,
      })
      results.nutrition.push(created.id)
    }
  }

  // Save fitness
  for (const item of parsed.fitness) {
    if (item.exercise_name) {
      const created = await createFitness({
        user_id: userId,
        exercise_name: item.exercise_name,
        sets: item.sets || null,
        reps: item.reps || null,
        weight: item.weight || null,
        cardio_minutes: item.cardio_minutes || null,
        timestamp,
      })
      results.fitness.push(created.id)
    }
  }

  // Save notes
  for (const note of parsed.notes) {
    if (note.content) {
      const created = await createNote({
        user_id: userId,
        content: note.content,
        timestamp,
      })
      results.notes.push(created.id)
    }
  }

  return results
}
