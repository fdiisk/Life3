'use client'

import { useState, useEffect } from 'react'
import type { Task, Habit, Goal, TimeBlock, Reflection, Value } from '@/lib/types'
import { CORE_VALUES } from '@/lib/constants'

interface EveningCloseOutProps {
  tasks: Task[]
  habits: Habit[]
  goals: Goal[]
  timeBlocks: TimeBlock[]
  values: Value[]
  userId: string
  customValues?: string[]
  onCreateReflection: (reflection: Omit<Reflection, 'id' | 'created_at'>) => Promise<void>
  onBatchUpdateValues: (ratings: Record<string, number>) => Promise<void>
  onComplete: () => void
}

export default function EveningCloseOut({
  tasks,
  habits,
  goals,
  timeBlocks,
  values,
  userId,
  customValues,
  onCreateReflection,
  onBatchUpdateValues,
  onComplete,
}: EveningCloseOutProps) {
  // Use custom values if provided, otherwise fall back to defaults
  const valuesList = customValues?.length ? customValues : [...CORE_VALUES]

  const [step, setStep] = useState(0)
  const [wins, setWins] = useState(['', '', ''])
  const [challenges, setChallenges] = useState('')
  const [tomorrow, setTomorrow] = useState('')
  const [valueRatings, setValueRatings] = useState<Record<string, number>>({})
  const [gratitude, setGratitude] = useState('')
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // Calculate daily stats
  const completedTasks = tasks.filter((t) => t.completed).length
  const totalTasks = tasks.length
  const completedHabits = habits.filter((h) => h.last_done === today).length
  const totalHabits = habits.length
  const totalTimeBlocked = timeBlocks.reduce((acc, block) => {
    const start = new Date(block.start_time)
    const end = new Date(block.end_time)
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }, 0)

  // Initialize value ratings
  useEffect(() => {
    const initial: Record<string, number> = {}
    valuesList.forEach((v) => {
      const existing = values.find((val) => val.name === v)
      initial[v] = existing?.daily_rating || 5
    })
    setValueRatings(initial)
  }, [values, valuesList])

  const handleNext = async () => {
    if (step === 3) {
      setLoading(true)
      // Save evening reflection
      const reflectionContent = `
**Wins:**
${wins.filter(Boolean).map((w, i) => `${i + 1}. ${w}`).join('\n')}

**Challenges:**
${challenges}

**Tomorrow's Focus:**
${tomorrow}

**Gratitude:**
${gratitude}

**Stats:**
- Tasks: ${completedTasks}/${totalTasks}
- Habits: ${completedHabits}/${totalHabits}
- Time Blocked: ${totalTimeBlocked.toFixed(1)}h
      `.trim()

      await Promise.all([
        onCreateReflection({
          user_id: userId,
          type: 'evening',
          content: reflectionContent,
          timestamp: new Date().toISOString(),
        }),
        // Save all value ratings in one batch call
        onBatchUpdateValues(valueRatings),
      ])
      setLoading(false)
    }

    if (step < 4) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const steps = [
    { title: 'Summary', icon: '📊' },
    { title: 'Wins', icon: '🏆' },
    { title: 'Values', icon: '💫' },
    { title: 'Reflect', icon: '📝' },
    { title: 'Tomorrow', icon: '🌅' },
  ]

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-indigo-900 to-purple-900 z-50 overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Evening Review</h1>
          <p className="text-indigo-200">
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
                  ? 'bg-white text-indigo-900'
                  : i < step
                  ? 'bg-indigo-700 text-white'
                  : 'bg-indigo-800 text-indigo-400'
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg p-6 min-h-[400px]">
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span>📊</span> Today's Summary
              </h2>
              <p className="text-indigo-200">Here's how your day went...</p>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {completedTasks}/{totalTasks}
                  </div>
                  <div className="text-indigo-200 text-sm">Tasks Done</div>
                  <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400"
                      style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-400">
                    {completedHabits}/{totalHabits}
                  </div>
                  <div className="text-indigo-200 text-sm">Habits</div>
                  <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400"
                      style={{ width: `${totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {totalTimeBlocked.toFixed(1)}h
                  </div>
                  <div className="text-indigo-200 text-sm">Time Blocked</div>
                </div>
              </div>

              {/* Habit streaks */}
              <div className="mt-6">
                <h3 className="text-white font-medium mb-3">Active Streaks 🔥</h3>
                <div className="flex flex-wrap gap-2">
                  {habits
                    .filter((h) => h.streak > 0)
                    .sort((a, b) => b.streak - a.streak)
                    .slice(0, 5)
                    .map((habit) => (
                      <span
                        key={habit.id}
                        className="px-3 py-1 bg-orange-500/30 text-orange-200 rounded-full text-sm"
                      >
                        {habit.name}: {habit.streak} days
                      </span>
                    ))}
                  {habits.filter((h) => h.streak > 0).length === 0 && (
                    <span className="text-indigo-300">No active streaks yet</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span>🏆</span> Today's Wins
              </h2>
              <p className="text-indigo-200">Celebrate what went well today!</p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl">{['🥇', '🥈', '🥉'][i]}</span>
                  <input
                    type="text"
                    value={wins[i]}
                    onChange={(e) => {
                      const newWins = [...wins]
                      newWins[i] = e.target.value
                      setWins(newWins)
                    }}
                    placeholder={`Win #${i + 1}`}
                    className="flex-1 bg-white/10 border-b-2 border-white/20 focus:border-white outline-none py-2 text-lg text-white placeholder-indigo-300"
                  />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span>💫</span> Evening Value Check-In
              </h2>
              <p className="text-indigo-200">How aligned did you feel with your values today?</p>
              <div className="space-y-4">
                {valuesList.map((value) => (
                  <div key={value} className="space-y-2">
                    <div className="flex justify-between text-white">
                      <span className="font-medium">{value}</span>
                      <span className="text-indigo-300 font-semibold">{valueRatings[value] || 5}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={valueRatings[value] || 5}
                      onChange={(e) =>
                        setValueRatings({ ...valueRatings, [value]: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span>📝</span> Reflect & Learn
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-indigo-200 mb-2">
                    What challenges did you face today?
                  </label>
                  <textarea
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder="Any obstacles or difficulties..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 h-24 resize-none text-white placeholder-indigo-300 focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-indigo-200 mb-2">
                    What are you grateful for tonight?
                  </label>
                  <textarea
                    value={gratitude}
                    onChange={(e) => setGratitude(e.target.value)}
                    placeholder="End the day with gratitude..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 h-24 resize-none text-white placeholder-indigo-300 focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span>🌅</span> Set Up Tomorrow
              </h2>
              <p className="text-indigo-200">What's your main focus for tomorrow?</p>
              <textarea
                value={tomorrow}
                onChange={(e) => setTomorrow(e.target.value)}
                placeholder="Tomorrow I will focus on..."
                className="w-full bg-white/10 border border-white/20 rounded-lg p-4 h-32 resize-none text-white placeholder-indigo-300 focus:ring-2 focus:ring-white/50 text-lg"
              />
              <div className="bg-indigo-800/50 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">💡 Quick Tips for Tomorrow</h3>
                <ul className="text-indigo-200 text-sm space-y-1">
                  <li>• Pick your top 3 priorities before bed</li>
                  <li>• Set out everything you need for morning habits</li>
                  <li>• Go to bed at the same time each night</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            className={`px-6 py-3 rounded-lg font-medium ${
              step === 0 ? 'invisible' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-3 bg-white text-indigo-900 rounded-lg font-medium hover:bg-indigo-100 disabled:opacity-50"
          >
            {loading ? 'Saving...' : step === 4 ? 'Finish & Rest 🌙' : 'Next →'}
          </button>
        </div>

        {/* Skip */}
        <div className="text-center mt-4">
          <button
            onClick={onComplete}
            className="text-indigo-300 hover:text-white text-sm"
          >
            Skip evening review
          </button>
        </div>
      </div>
    </div>
  )
}
