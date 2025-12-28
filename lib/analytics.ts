'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { TimeBlock, Task, Habit, Goal, Value, Nutrition, Fitness, Reflection } from '@/lib/types'

export type DateRange = 'daily' | 'weekly' | 'monthly'

function getDateRange(range: DateRange): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString()
  let start: Date

  switch (range) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'weekly':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'monthly':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
  }

  return { start: start.toISOString(), end }
}

// Time allocation per life area
export async function getTimeAllocation(userId: string, range: DateRange) {
  const supabase = createServerClient()
  const { start, end } = getDateRange(range)

  const { data, error } = await supabase
    .from('time_blocks')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', start)
    .lte('start_time', end)

  if (error) throw error

  const blocks = data as TimeBlock[]
  const allocation: Record<string, number> = {
    work: 0,
    health: 0,
    personal: 0,
    learning: 0,
    social: 0,
    rest: 0,
  }

  blocks.forEach((block) => {
    const duration = (new Date(block.end_time).getTime() - new Date(block.start_time).getTime()) / (1000 * 60)
    allocation[block.type] = (allocation[block.type] || 0) + duration
  })

  return Object.entries(allocation).map(([name, value]) => ({
    name,
    value: Math.round(value),
    hours: Math.round(value / 60 * 10) / 10,
  }))
}

// Planned vs actual tasks/habits
export async function getPlannedVsActual(userId: string, range: DateRange) {
  const supabase = createServerClient()
  const { start, end } = getDateRange(range)

  const [tasksResult, habitsResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end),
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId),
  ])

  if (tasksResult.error) throw tasksResult.error
  if (habitsResult.error) throw habitsResult.error

  const tasks = tasksResult.data as Task[]
  const habits = habitsResult.data as Habit[]

  const today = new Date().toISOString().split('T')[0]
  const completedHabitsToday = habits.filter((h) => {
    const lastDone = h.last_done ? new Date(h.last_done).toISOString().split('T')[0] : null
    return lastDone === today
  }).length

  return [
    {
      name: 'Tasks',
      planned: tasks.length,
      completed: tasks.filter((t) => t.completed).length,
    },
    {
      name: 'Habits',
      planned: habits.filter((h) => h.frequency === 'daily').length,
      completed: completedHabitsToday,
    },
  ]
}

// Habit streaks
export async function getHabitStreaks(userId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('streak', { ascending: false })

  if (error) throw error

  return (data as Habit[]).map((habit) => ({
    name: habit.name.substring(0, 15) + (habit.name.length > 15 ? '...' : ''),
    streak: habit.streak,
    frequency: habit.frequency,
  }))
}

// Goal progress (weight-adjusted)
export async function getGoalProgress(userId: string) {
  const supabase = createServerClient()

  const [goalsResult, tasksResult] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', userId),
    supabase.from('tasks').select('*').eq('user_id', userId),
  ])

  if (goalsResult.error) throw goalsResult.error
  if (tasksResult.error) throw tasksResult.error

  const goals = goalsResult.data as Goal[]
  const tasks = tasksResult.data as Task[]

  return goals
    .filter((g) => !g.parent_goal_id) // Top-level goals only
    .map((goal) => {
      const goalTasks = tasks.filter((t) => t.goal_id === goal.id)
      const completedTasks = goalTasks.filter((t) => t.completed).length
      const progress = goalTasks.length > 0 ? (completedTasks / goalTasks.length) * 100 : 0

      return {
        name: goal.title.substring(0, 20) + (goal.title.length > 20 ? '...' : ''),
        progress: Math.round(progress),
        weight: goal.weight,
        weightedProgress: Math.round(progress * (goal.weight / 100)),
        completed: goal.completed,
      }
    })
    .sort((a, b) => b.weight - a.weight)
}

// Values trend over time
export async function getValuesTrend(userId: string, range: DateRange) {
  const supabase = createServerClient()
  const { start, end } = getDateRange(range)

  const { data, error } = await supabase
    .from('values')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', start)
    .lte('timestamp', end)
    .order('timestamp', { ascending: true })

  if (error) throw error

  const values = data as Value[]

  // Group by date and value name
  const grouped: Record<string, Record<string, number>> = {}

  values.forEach((v) => {
    const date = new Date(v.timestamp).toISOString().split('T')[0]
    if (!grouped[date]) grouped[date] = {}
    grouped[date][v.name] = v.daily_rating
  })

  return Object.entries(grouped).map(([date, ratings]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ...ratings,
  }))
}

// Nutrition macros over time
export async function getNutritionTrend(userId: string, range: DateRange) {
  const supabase = createServerClient()
  const { start, end } = getDateRange(range)

  const { data, error } = await supabase
    .from('nutrition')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', start)
    .lte('timestamp', end)
    .order('timestamp', { ascending: true })

  if (error) throw error

  const nutrition = data as Nutrition[]

  // Group by date
  const grouped: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {}

  nutrition.forEach((n) => {
    const date = new Date(n.timestamp).toISOString().split('T')[0]
    if (!grouped[date]) grouped[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    grouped[date].calories += n.macros?.calories || 0
    grouped[date].protein += n.macros?.protein || 0
    grouped[date].carbs += n.macros?.carbs || 0
    grouped[date].fat += n.macros?.fat || 0
  })

  return Object.entries(grouped).map(([date, macros]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ...macros,
  }))
}

// Fitness volume over time
export async function getFitnessTrend(userId: string, range: DateRange) {
  const supabase = createServerClient()
  const { start, end } = getDateRange(range)

  const { data, error } = await supabase
    .from('fitness')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', start)
    .lte('timestamp', end)
    .order('timestamp', { ascending: true })

  if (error) throw error

  const fitness = data as Fitness[]

  // Group by date
  const grouped: Record<string, { volume: number; cardio: number; exercises: number }> = {}

  fitness.forEach((f) => {
    const date = new Date(f.timestamp).toISOString().split('T')[0]
    if (!grouped[date]) grouped[date] = { volume: 0, cardio: 0, exercises: 0 }
    grouped[date].exercises += 1
    grouped[date].cardio += f.cardio_minutes || 0
    if (f.sets && f.reps && f.weight) {
      grouped[date].volume += f.sets * f.reps * f.weight
    }
  })

  return Object.entries(grouped).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ...data,
  }))
}

// Time to goal estimates
export async function getTimeToGoal(userId: string) {
  const supabase = createServerClient()

  const [goalsResult, tasksResult] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', userId).eq('completed', false),
    supabase.from('tasks').select('*').eq('user_id', userId),
  ])

  if (goalsResult.error) throw goalsResult.error
  if (tasksResult.error) throw tasksResult.error

  const goals = goalsResult.data as Goal[]
  const tasks = tasksResult.data as Task[]

  return goals
    .filter((g) => !g.parent_goal_id)
    .map((goal) => {
      const goalTasks = tasks.filter((t) => t.goal_id === goal.id)
      const completedTasks = goalTasks.filter((t) => t.completed)
      const remainingTasks = goalTasks.length - completedTasks.length

      // Estimate based on completion rate (assume 1 task/day if no history)
      const daysToComplete = remainingTasks > 0 ? remainingTasks : 0

      return {
        goal: goal.title,
        remainingTasks,
        totalTasks: goalTasks.length,
        estimatedDays: daysToComplete,
        progress: goalTasks.length > 0 ? Math.round((completedTasks.length / goalTasks.length) * 100) : 0,
      }
    })
}

// AI theme analysis from reflections
export async function getReflectionThemes(userId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(30)

  if (error) throw error

  const reflections = data as Reflection[]

  if (reflections.length < 3) {
    return { themes: [], summary: 'Need more reflections to identify themes.' }
  }

  // Use AI to analyze themes
  const { summarizeReflections } = await import('@/lib/ai')
  const summary = await summarizeReflections(reflections.map((r) => r.content))

  // Extract key themes (simple keyword extraction)
  const words = reflections
    .map((r) => r.content.toLowerCase())
    .join(' ')
    .split(/\s+/)
    .filter((w) => w.length > 4)

  const wordCount: Record<string, number> = {}
  words.forEach((w) => {
    wordCount[w] = (wordCount[w] || 0) + 1
  })

  const themes = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  return { themes, summary }
}
