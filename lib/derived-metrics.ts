'use server'

import { createServerClient } from './supabase/server'

// Calculate all streaks for user's habits
export async function calculateAllStreaks(userId: string): Promise<Record<string, number>> {
  try {
    const supabase = createServerClient()
    const { data: habits, error } = await supabase.from('habits').select('*').eq('user_id', userId)
    if (error || !habits) return {}

    const today = new Date()
    const streaks: Record<string, number> = {}

    for (const habit of habits) {
      if (!habit.last_done) {
        streaks[habit.id] = 0
        continue
      }

      const lastDone = new Date(habit.last_done)
      const diffDays = Math.floor((today.getTime() - lastDone.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays <= 1) {
        streaks[habit.id] = habit.streak
      } else {
        streaks[habit.id] = 0
      }
    }

    return streaks
  } catch {
    return {}
  }
}

// Calculate goal progress for all goals
export async function calculateAllGoalProgress(userId: string): Promise<Record<string, number>> {
  try {
    const supabase = createServerClient()
    const [{ data: tasks }, { data: goals }] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('goals').select('*').eq('user_id', userId),
    ])

    if (!tasks || !goals) return {}

    const progress: Record<string, number> = {}

    for (const goal of goals) {
      const goalTasks = tasks.filter((t: { goal_id: string }) => t.goal_id === goal.id)
      const subGoals = goals.filter((g: { parent_goal_id: string }) => g.parent_goal_id === goal.id)

      if (goalTasks.length === 0 && subGoals.length === 0) {
        progress[goal.id] = goal.completed ? 100 : 0
        continue
      }

      let total = 0
      let completed = 0

      if (goalTasks.length > 0) {
        total += goalTasks.length
        completed += goalTasks.filter((t: { completed: boolean }) => t.completed).length
      }

      if (subGoals.length > 0) {
        total += subGoals.length
        completed += subGoals.filter((g: { completed: boolean }) => g.completed).length
      }

      progress[goal.id] = total > 0 ? Math.round((completed / total) * 100) : 0
    }

    return progress
  } catch {
    return {}
  }
}

// Calculate values trend over time
export async function calculateValuesTrend(userId: string, days = 7): Promise<Record<string, number[]>> {
  try {
    const supabase = createServerClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: values, error } = await supabase
      .from('values')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true })

    if (error || !values) return {}

    const trends: Record<string, number[]> = {}

    for (const value of values) {
      if (!trends[value.name]) {
        trends[value.name] = []
      }
      trends[value.name].push(value.daily_rating)
    }

    return trends
  } catch {
    return {}
  }
}

// Calculate planned vs actual time
export async function calculatePlannedVsActual(userId: string, date: string): Promise<{
  planned: Record<string, number>
  actual: Record<string, number>
  efficiency: number
}> {
  const defaultResult = {
    planned: { work: 0, health: 0, personal: 0, learning: 0, social: 0, rest: 0 },
    actual: { work: 0, health: 0, personal: 0, learning: 0, social: 0, rest: 0 },
    efficiency: 0,
  }

  try {
    const supabase = createServerClient()
    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`

    const [{ data: blocks }, { data: tasks }] = await Promise.all([
      supabase.from('time_blocks').select('*').eq('user_id', userId).gte('start_time', startOfDay).lte('start_time', endOfDay),
      supabase.from('tasks').select('*').eq('user_id', userId).eq('due_date', date),
    ])

    const planned: Record<string, number> = {
      work: 0, health: 0, personal: 0, learning: 0, social: 0, rest: 0
    }
    const actual: Record<string, number> = { ...planned }

    if (blocks) {
      for (const block of blocks) {
        const duration = (new Date(block.end_time).getTime() - new Date(block.start_time).getTime()) / (1000 * 60 * 60)
        planned[block.type] = (planned[block.type] || 0) + duration

        if (block.linked_task_id) {
          const task = tasks?.find((t: { id: string }) => t.id === block.linked_task_id)
          if (task?.completed) {
            actual[block.type] = (actual[block.type] || 0) + duration
          }
        } else {
          actual[block.type] = (actual[block.type] || 0) + duration
        }
      }
    }

    const totalPlanned = Object.values(planned).reduce((a, b) => a + b, 0)
    const totalActual = Object.values(actual).reduce((a, b) => a + b, 0)
    const efficiency = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0

    return { planned, actual, efficiency }
  } catch {
    return defaultResult
  }
}

// Get dashboard data summary
export async function getDashboardMetrics(userId: string): Promise<{
  streaks: Record<string, number>
  goalProgress: Record<string, number>
  valuesTrend: Record<string, number[]>
  todayEfficiency: number
  activeHabits: number
  completedTasks: number
  totalTasks: number
}> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const [streaks, goalProgress, valuesTrend, plannedVsActual] = await Promise.all([
      calculateAllStreaks(userId),
      calculateAllGoalProgress(userId),
      calculateValuesTrend(userId, 7),
      calculatePlannedVsActual(userId, today),
    ])

    const supabase = createServerClient()
    const [{ data: habits }, { data: tasks }] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('tasks').select('*').eq('user_id', userId).eq('due_date', today),
    ])

    const activeHabits = habits?.filter((h: { last_done: string }) => h.last_done === today).length || 0
    const completedTasks = tasks?.filter((t: { completed: boolean }) => t.completed).length || 0
    const totalTasks = tasks?.length || 0

    return {
      streaks,
      goalProgress,
      valuesTrend,
      todayEfficiency: plannedVsActual.efficiency,
      activeHabits,
      completedTasks,
      totalTasks,
    }
  } catch {
    return {
      streaks: {},
      goalProgress: {},
      valuesTrend: {},
      todayEfficiency: 0,
      activeHabits: 0,
      completedTasks: 0,
      totalTasks: 0,
    }
  }
}

// Detect new data patterns for auto-dashboard updates
export async function detectNewDataPatterns(userId: string): Promise<{
  hasNutrition: boolean
  hasFitness: boolean
  hasReflections: boolean
  hasGoals: boolean
  hasTimeBlocks: boolean
  suggestedWidgets: string[]
}> {
  const defaultResult = {
    hasNutrition: false,
    hasFitness: false,
    hasReflections: false,
    hasGoals: false,
    hasTimeBlocks: false,
    suggestedWidgets: [],
  }

  try {
    const supabase = createServerClient()

    const [
      { count: nutritionCount },
      { count: fitnessCount },
      { count: reflectionCount },
      { count: goalCount },
      { count: blockCount },
    ] = await Promise.all([
      supabase.from('nutrition').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('fitness').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('reflections').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('time_blocks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ])

    const suggestedWidgets: string[] = []

    if ((nutritionCount || 0) >= 3) suggestedWidgets.push('nutrition-chart')
    if ((fitnessCount || 0) >= 3) suggestedWidgets.push('fitness-chart')
    if ((reflectionCount || 0) >= 3) suggestedWidgets.push('theme-highlights')
    if ((goalCount || 0) >= 1) suggestedWidgets.push('goal-progress')
    if ((blockCount || 0) >= 5) suggestedWidgets.push('time-allocation')

    return {
      hasNutrition: (nutritionCount || 0) > 0,
      hasFitness: (fitnessCount || 0) > 0,
      hasReflections: (reflectionCount || 0) > 0,
      hasGoals: (goalCount || 0) > 0,
      hasTimeBlocks: (blockCount || 0) > 0,
      suggestedWidgets,
    }
  } catch {
    return defaultResult
  }
}
