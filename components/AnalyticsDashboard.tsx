'use client'

import { useState, useEffect, useCallback } from 'react'
import TimeAllocationChart from './charts/TimeAllocationChart'
import PlannedVsActualChart from './charts/PlannedVsActualChart'
import HabitStreaksChart from './charts/HabitStreaksChart'
import GoalProgressChart from './charts/GoalProgressChart'
import ValuesTrendChart from './charts/ValuesTrendChart'
import NutritionChart from './charts/NutritionChart'
import FitnessChart from './charts/FitnessChart'
import TimeToGoal from './charts/TimeToGoal'
import ThemeHighlights from './charts/ThemeHighlights'
import * as analytics from '@/lib/analytics'
import type { DateRange } from '@/lib/analytics'

interface AnalyticsDashboardProps {
  userId: string
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [range, setRange] = useState<DateRange>('weekly')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    timeAllocation: Awaited<ReturnType<typeof analytics.getTimeAllocation>>
    plannedVsActual: Awaited<ReturnType<typeof analytics.getPlannedVsActual>>
    habitStreaks: Awaited<ReturnType<typeof analytics.getHabitStreaks>>
    goalProgress: Awaited<ReturnType<typeof analytics.getGoalProgress>>
    valuesTrend: Awaited<ReturnType<typeof analytics.getValuesTrend>>
    nutritionTrend: Awaited<ReturnType<typeof analytics.getNutritionTrend>>
    fitnessTrend: Awaited<ReturnType<typeof analytics.getFitnessTrend>>
    timeToGoal: Awaited<ReturnType<typeof analytics.getTimeToGoal>>
    themes: Awaited<ReturnType<typeof analytics.getReflectionThemes>>
  } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        timeAllocation,
        plannedVsActual,
        habitStreaks,
        goalProgress,
        valuesTrend,
        nutritionTrend,
        fitnessTrend,
        timeToGoal,
        themes,
      ] = await Promise.all([
        analytics.getTimeAllocation(userId, range),
        analytics.getPlannedVsActual(userId, range),
        analytics.getHabitStreaks(userId),
        analytics.getGoalProgress(userId),
        analytics.getValuesTrend(userId, range),
        analytics.getNutritionTrend(userId, range),
        analytics.getFitnessTrend(userId, range),
        analytics.getTimeToGoal(userId),
        analytics.getReflectionThemes(userId),
      ])

      setData({
        timeAllocation,
        plannedVsActual,
        habitStreaks,
        goalProgress,
        valuesTrend,
        nutritionTrend,
        fitnessTrend,
        timeToGoal,
        themes,
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, range])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Failed to load analytics</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
            <p className="text-gray-500">Track your progress and patterns</p>
          </div>

          {/* Time Range Filter */}
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow">
            {(['daily', 'weekly', 'monthly'] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  range === r
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Allocation */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Time Allocation</h2>
            <TimeAllocationChart data={data.timeAllocation} />
          </div>

          {/* Planned vs Actual */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Planned vs Completed</h2>
            <PlannedVsActualChart data={data.plannedVsActual} />
          </div>

          {/* Habit Streaks */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Habit Streaks 🔥</h2>
            <HabitStreaksChart data={data.habitStreaks} />
          </div>

          {/* Goal Progress */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Goal Progress (Weight-Adjusted)</h2>
            <GoalProgressChart data={data.goalProgress} />
          </div>

          {/* Time to Goal */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Time to Goal</h2>
            <TimeToGoal data={data.timeToGoal} />
          </div>

          {/* Theme Highlights */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Reflection Themes</h2>
            <ThemeHighlights themes={data.themes.themes} summary={data.themes.summary} />
          </div>

          {/* Values Trend */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Values Over Time</h2>
            <ValuesTrendChart data={data.valuesTrend} />
          </div>

          {/* Nutrition Trend */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Nutrition</h2>
            <NutritionChart data={data.nutritionTrend} />
          </div>

          {/* Fitness Trend */}
          <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Fitness Progress</h2>
            <FitnessChart data={data.fitnessTrend} />
          </div>
        </div>

        {/* Back to Dashboard Link */}
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-500 hover:text-blue-600 font-medium">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
