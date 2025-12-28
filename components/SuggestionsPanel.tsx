'use client'

import { useState, useEffect } from 'react'
import type { Habit, Goal } from '@/lib/types'

interface Suggestion {
  name?: string
  title?: string
  frequency?: string
  reason: string
}

interface SuggestionsPanelProps {
  suggestions: {
    habits: Suggestion[]
    goals: Suggestion[]
    insights: string[]
  } | null
  onAddHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'streak' | 'last_done'>) => Promise<void>
  onAddGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'completed'>) => Promise<void>
  userId: string
  loading?: boolean
}

export default function SuggestionsPanel({
  suggestions,
  onAddHabit,
  onAddGoal,
  userId,
  loading = false,
}: SuggestionsPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-purple-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-purple-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!suggestions || (suggestions.habits.length === 0 && suggestions.goals.length === 0 && suggestions.insights.length === 0)) {
    return null
  }

  const handleAddHabit = async (habit: Suggestion) => {
    if (!habit.name) return
    const habitName = habit.name
    setAdding(habitName)
    try {
      await onAddHabit({
        user_id: userId,
        name: habitName,
        frequency: (habit.frequency as 'daily' | 'weekly' | 'monthly') || 'daily',
      })
      setDismissed(prev => new Set([...Array.from(prev), habitName]))
    } finally {
      setAdding(null)
    }
  }

  const handleAddGoal = async (goal: Suggestion) => {
    if (!goal.title) return
    const goalTitle = goal.title
    setAdding(goalTitle)
    try {
      await onAddGoal({
        user_id: userId,
        title: goalTitle,
        parent_goal_id: null,
        weight: 50,
      })
      setDismissed(prev => new Set([...Array.from(prev), goalTitle]))
    } finally {
      setAdding(null)
    }
  }

  const visibleHabits = suggestions.habits.filter(h => h.name && !dismissed.has(h.name))
  const visibleGoals = suggestions.goals.filter(g => g.title && !dismissed.has(g.title))

  if (visibleHabits.length === 0 && visibleGoals.length === 0 && suggestions.insights.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">💡</span>
        <h3 className="font-semibold text-purple-800">AI Suggestions</h3>
      </div>

      {/* Insights */}
      {suggestions.insights.length > 0 && (
        <div className="space-y-2">
          {suggestions.insights.map((insight, i) => (
            <div key={i} className="text-sm text-purple-700 bg-white/50 rounded p-2">
              {insight}
            </div>
          ))}
        </div>
      )}

      {/* Habit Suggestions */}
      {visibleHabits.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-purple-700">Suggested Habits</h4>
          {visibleHabits.map((habit) => (
            <div
              key={habit.name}
              className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-800">{habit.name}</div>
                <div className="text-xs text-gray-500">{habit.reason}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDismissed(prev => new Set([...Array.from(prev), habit.name!]))}
                  className="text-gray-400 hover:text-gray-600 px-2"
                >
                  ✕
                </button>
                <button
                  onClick={() => handleAddHabit(habit)}
                  disabled={adding === habit.name}
                  className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50"
                >
                  {adding === habit.name ? '...' : '+ Add'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goal Suggestions */}
      {visibleGoals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-purple-700">Suggested Goals</h4>
          {visibleGoals.map((goal) => (
            <div
              key={goal.title}
              className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-800">{goal.title}</div>
                <div className="text-xs text-gray-500">{goal.reason}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDismissed(prev => new Set([...Array.from(prev), goal.title!]))}
                  className="text-gray-400 hover:text-gray-600 px-2"
                >
                  ✕
                </button>
                <button
                  onClick={() => handleAddGoal(goal)}
                  disabled={adding === goal.title}
                  className="px-3 py-1 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600 disabled:opacity-50"
                >
                  {adding === goal.title ? '...' : '+ Add'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
