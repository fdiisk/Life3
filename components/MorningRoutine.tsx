'use client'

import { useState, useEffect } from 'react'
import type { Habit, Goal, Value } from '@/lib/types'
import { CORE_VALUES } from '@/lib/constants'

interface MorningRoutineProps {
  habits: Habit[]
  goals: Goal[]
  values: Value[]
  userId: string
  customValues?: string[]
  onCompleteHabit: (id: string) => Promise<void>
  onBatchUpdateValues: (ratings: Record<string, number>) => Promise<void>
  onComplete: () => void
}

export default function MorningRoutine({
  habits,
  goals,
  values,
  userId,
  customValues,
  onCompleteHabit,
  onBatchUpdateValues,
  onComplete,
}: MorningRoutineProps) {
  // Use custom values if provided, otherwise fall back to defaults
  const valuesList = customValues?.length ? customValues : [...CORE_VALUES]

  const [step, setStep] = useState(0)
  const [gratitude, setGratitude] = useState(['', '', ''])
  const [intentions, setIntentions] = useState('')
  const [valueRatings, setValueRatings] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  // Initialize value ratings from existing data
  useEffect(() => {
    const initial: Record<string, number> = {}
    valuesList.forEach((v) => {
      const existing = values.find((val) => val.name === v)
      initial[v] = existing?.daily_rating || 5
    })
    setValueRatings(initial)
  }, [values, valuesList])

  const morningHabits = habits.filter((h) =>
    h.name.toLowerCase().includes('morning') ||
    h.name.toLowerCase().includes('wake') ||
    h.name.toLowerCase().includes('meditation') ||
    h.name.toLowerCase().includes('exercise') ||
    h.name.toLowerCase().includes('journal')
  )

  const topGoals = goals
    .filter((g) => !g.parent_goal_id && !g.completed)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)

  const handleNext = async () => {
    if (step === 2) {
      setLoading(true)
      // Save all value ratings in one batch call
      await onBatchUpdateValues(valueRatings)
      setLoading(false)
    }
    if (step < 3) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const steps = [
    { title: 'Gratitude', icon: '🙏' },
    { title: 'Top Goals', icon: '🎯' },
    { title: 'Value Check', icon: '💫' },
    { title: 'Morning Habits', icon: '☀️' },
  ]

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-amber-50 to-orange-50 z-50 overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-800">Good Morning</h1>
          <p className="text-amber-600">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                i === step
                  ? 'bg-amber-500 text-white'
                  : i < step
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-amber-100 text-amber-400'
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[400px]">
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <span>🙏</span> Three Things You're Grateful For
              </h2>
              <p className="text-gray-500">Start your day with gratitude to set a positive tone.</p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl">{['1️⃣', '2️⃣', '3️⃣'][i]}</span>
                  <input
                    type="text"
                    value={gratitude[i]}
                    onChange={(e) => {
                      const newGratitude = [...gratitude]
                      newGratitude[i] = e.target.value
                      setGratitude(newGratitude)
                    }}
                    placeholder={`I'm grateful for...`}
                    className="flex-1 border-b-2 border-amber-200 focus:border-amber-500 outline-none py-2 text-lg"
                  />
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <span>🎯</span> Today's Focus Goals
              </h2>
              <p className="text-gray-500">Review your top priorities for today.</p>
              {topGoals.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No active goals yet. Add some goals to get started!</p>
              ) : (
                <div className="space-y-4">
                  {topGoals.map((goal, i) => (
                    <div
                      key={goal.id}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
                    >
                      <span className="text-2xl">{['🥇', '🥈', '🥉'][i]}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{goal.title}</h3>
                        <p className="text-sm text-gray-500">Priority: {goal.weight}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your main intention for today?
                </label>
                <textarea
                  value={intentions}
                  onChange={(e) => setIntentions(e.target.value)}
                  placeholder="Today I will focus on..."
                  className="w-full border rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <span>💫</span> Value Check-In
              </h2>
              <p className="text-gray-500">Rate how aligned you feel with your core values right now.</p>
              <div className="space-y-4">
                {valuesList.map((value) => (
                  <div key={value} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">{value}</span>
                      <span className="text-amber-600 font-semibold">{valueRatings[value] || 5}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={valueRatings[value] || 5}
                      onChange={(e) =>
                        setValueRatings({ ...valueRatings, [value]: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <span>☀️</span> Morning Habits
              </h2>
              <p className="text-gray-500">Complete your morning habits to build momentum.</p>
              {morningHabits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No morning habits found.</p>
                  <p className="text-sm text-gray-400">
                    Tip: Add habits with "morning", "wake", "meditation", or "journal" in the name.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {morningHabits.map((habit) => {
                    const doneToday = habit.last_done === new Date().toISOString().split('T')[0]
                    return (
                      <button
                        key={habit.id}
                        onClick={() => !doneToday && onCompleteHabit(habit.id)}
                        disabled={doneToday}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg transition ${
                          doneToday
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-50 hover:bg-amber-50 text-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{doneToday ? '✅' : '⬜'}</span>
                        <div className="flex-1 text-left">
                          <span className="font-medium">{habit.name}</span>
                          <span className="text-sm text-gray-400 ml-2">
                            🔥 {habit.streak} day streak
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            className={`px-6 py-3 rounded-lg font-medium ${
              step === 0 ? 'invisible' : 'bg-white text-amber-700 hover:bg-amber-50'
            }`}
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : step === 3 ? "Let's Go! 🚀" : 'Next →'}
          </button>
        </div>

        {/* Skip */}
        <div className="text-center mt-4">
          <button
            onClick={onComplete}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Skip morning routine
          </button>
        </div>
      </div>
    </div>
  )
}
