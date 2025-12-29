'use client'

import { useState, useEffect, useCallback } from 'react'
import CaptureInput from './CaptureInput'
import DailyPlanner from './DailyPlanner'
import HabitsTasks from './HabitsTasks'
import NutritionLogger from './NutritionLogger'
import FitnessLogger from './FitnessLogger'
import ReflectionsNotes from './ReflectionsNotes'
import GoalsManager from './GoalsManager'
import DayFlowManager from './DayFlowManager'
import QuickActions from './QuickActions'
import SmartMetrics from './SmartMetrics'
import SuggestionsPanel from './SuggestionsPanel'
import JournalWriter from './JournalWriter'
import * as actions from '@/actions'
import type { Task, Habit, Goal, TimeBlock, Nutrition, Fitness, Value, Reflection, Note, Improvement, Meal, Journal, UserSettings } from '@/lib/types'
import type { AISuggestions } from '@/lib/ai-suggestions'
import { CORE_VALUES } from '@/lib/constants'

interface DashboardMetrics {
  streaks: Record<string, number>
  goalProgress: Record<string, number>
  valuesTrend: Record<string, number[]>
  todayEfficiency: number
  activeHabits: number
  completedTasks: number
  totalTasks: number
}

interface DashboardProps {
  userId: string
}

export default function Dashboard({ userId }: DashboardProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [nutrition, setNutrition] = useState<Nutrition[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [fitness, setFitness] = useState<Fitness[]>([])
  const [values, setValues] = useState<Value[]>([])
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [improvements, setImprovements] = useState<Improvement[]>([])
  const [journal, setJournal] = useState<Journal | null>(null)
  const [pastJournals, setPastJournals] = useState<Journal[]>([])
  const [themeSummary, setThemeSummary] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null)
  const [suggestedWidgets, setSuggestedWidgets] = useState<string[]>([])
  const [customValues, setCustomValues] = useState<string[]>([...CORE_VALUES])
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)

  // Helper for async actions with error handling
  const withSaving = async (fn: () => Promise<void>) => {
    setSaving(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      console.error('Action failed:', err)
      setError('Operation failed. Check if database tables exist.')
    } finally {
      setSaving(false)
    }
  }

  const loadData = useCallback(async () => {
    setError(null)
    try {
      const [
        tasksData,
        habitsData,
        goalsData,
        blocksData,
        nutritionData,
        mealsData,
        fitnessData,
        valuesData,
        reflectionsData,
        notesData,
        improvementsData,
        journalData,
        pastJournalsData,
        summary,
        metricsData,
        patternsData,
        suggestionsData,
        settingsData,
      ] = await Promise.all([
        actions.getTasks(userId, true).catch(() => []),
        actions.getHabits(userId).catch(() => []),
        actions.getGoals(userId).catch(() => []),
        actions.getTimeBlocks(userId, selectedDate).catch(() => []),
        actions.getNutrition(userId, selectedDate).catch(() => []),
        actions.getMeals(userId).catch(() => []),
        actions.getFitness(userId, selectedDate).catch(() => []),
        actions.getValues(userId, selectedDate).catch(() => []),
        actions.getReflections(userId).catch(() => []),
        actions.getNotes(userId).catch(() => []),
        actions.getImprovements(userId).catch(() => []),
        actions.getJournal(userId, selectedDate).catch(() => null),
        actions.getJournals(userId, 30).catch(() => []),
        actions.getThemeSummary(userId).catch(() => null),
        actions.getDashboardMetricsAction(userId).catch(() => null),
        actions.detectDataPatternsAction(userId).catch(() => ({ suggestedWidgets: [] })),
        actions.getSuggestionsAction(userId).catch(() => null),
        actions.getUserSettings(userId).catch(() => null),
      ])

      setTasks(tasksData)
      setHabits(habitsData)
      setGoals(goalsData)
      setTimeBlocks(blocksData)
      setNutrition(nutritionData)
      setMeals(mealsData)
      setFitness(fitnessData)
      setValues(valuesData)
      setReflections(reflectionsData)
      setNotes(notesData)
      setImprovements(improvementsData)
      setJournal(journalData)
      setPastJournals(pastJournalsData)
      setThemeSummary(summary)
      setMetrics(metricsData)
      setSuggestedWidgets(patternsData.suggestedWidgets)
      setSuggestions(suggestionsData)
      setUserSettings(settingsData)
      if (settingsData?.core_values && settingsData.core_values.length > 0) {
        setCustomValues(settingsData.core_values)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load data. Check if database tables exist in Supabase.')
    } finally {
      setLoading(false)
    }
  }, [userId, selectedDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reload when date changes
  useEffect(() => {
    if (!loading) {
      setLoading(true)
      loadData()
    }
  }, [selectedDate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Life3</h1>
              <p className="text-gray-500">{new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</p>
            </div>
            {/* Date Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const d = new Date(selectedDate)
                  d.setDate(d.getDate() - 1)
                  setSelectedDate(d.toISOString().split('T')[0])
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
                title="Previous day"
              >
                ◀
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={today}
                className="border rounded-lg px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => {
                  const d = new Date(selectedDate)
                  d.setDate(d.getDate() + 1)
                  const newDate = d.toISOString().split('T')[0]
                  if (newDate <= today) setSelectedDate(newDate)
                }}
                disabled={selectedDate >= today}
                className="p-2 hover:bg-gray-200 rounded-lg transition disabled:opacity-30"
                title="Next day"
              >
                ▶
              </button>
              {selectedDate !== today && (
                <button
                  onClick={() => setSelectedDate(today)}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  Today
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/help"
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
            >
              Help
            </a>
            <a
              href="/settings"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Settings
            </a>
            <a
              href="/analytics"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Analytics
            </a>
          </div>
        </header>

        {/* Error/Status Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <strong>Error:</strong> {error}
            <p className="text-sm mt-1">
              Make sure you&apos;ve run the SQL schema in Supabase SQL Editor.
            </p>
          </div>
        )}
        {saving && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center">
            Saving...
          </div>
        )}

        {/* Quick Capture */}
        <div className="mb-6">
          <CaptureInput userId={userId} onSave={loadData} />
        </div>

        {/* Smart Metrics & Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SmartMetrics
            metrics={metrics}
            suggestedWidgets={suggestedWidgets}
          />
          <SuggestionsPanel
            suggestions={suggestions}
            userId={userId}
            onAddHabit={async (habit) => {
              await withSaving(async () => {
                await actions.createHabit(habit)
                await loadData()
              })
            }}
            onAddGoal={async (goal) => {
              await withSaving(async () => {
                await actions.createGoal(goal)
                await loadData()
              })
            }}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <DailyPlanner
              timeBlocks={timeBlocks}
              tasks={tasks}
              habits={habits}
              userId={userId}
              onCreateBlock={async (block) => {
                // Optimistic: add temp block immediately
                const tempId = 'temp-' + Date.now()
                const tempBlock = { ...block, id: tempId, created_at: new Date().toISOString() } as TimeBlock
                setTimeBlocks(prev => [...prev, tempBlock])
                try {
                  await actions.createTimeBlock(block)
                  // Refresh to get real ID
                  const blocks = await actions.getTimeBlocks(userId, selectedDate)
                  setTimeBlocks(blocks)
                } catch {
                  setTimeBlocks(prev => prev.filter(b => b.id !== tempId))
                }
              }}
              onDeleteBlock={async (id) => {
                // Optimistic: remove immediately
                setTimeBlocks(prev => prev.filter(b => b.id !== id))
                try {
                  await actions.deleteTimeBlock(id)
                } catch {
                  loadData() // Revert on error
                }
              }}
              onCompleteTask={async (id) => {
                // Optimistic: mark completed immediately
                setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t))
                try {
                  await actions.updateTask(id, { completed: true })
                } catch {
                  setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: false } : t))
                }
              }}
              onCompleteHabit={async (id) => {
                // Optimistic: update last_done and increment streak
                const today = new Date().toISOString().split('T')[0]
                setHabits(prev => prev.map(h =>
                  h.id === id ? { ...h, last_done: today, streak: h.streak + 1 } : h
                ))
                try {
                  await actions.completeHabit(id)
                } catch {
                  loadData() // Revert on error
                }
              }}
            />

            <HabitsTasks
              tasks={tasks}
              habits={habits}
              goals={goals}
              userId={userId}
              onCreateTask={async (task) => {
                await actions.createTask(task)
                loadData()
              }}
              onUpdateTask={async (id, updates) => {
                await actions.updateTask(id, updates)
                loadData()
              }}
              onDeleteTask={async (id) => {
                await actions.deleteTask(id)
                loadData()
              }}
              onCreateHabit={async (habit) => {
                await actions.createHabit(habit)
                loadData()
              }}
              onUpdateHabit={async (id, updates) => {
                await actions.updateHabit(id, updates)
                loadData()
              }}
              onDeleteHabit={async (id) => {
                await actions.deleteHabit(id)
                loadData()
              }}
              onCompleteHabit={async (id) => {
                await actions.completeHabit(id)
                loadData()
              }}
            />

            <GoalsManager
              goals={goals}
              tasks={tasks}
              habits={habits}
              userId={userId}
              onCreateGoal={async (goal) => {
                await actions.createGoal(goal)
                loadData()
              }}
              onUpdateGoal={async (id, updates) => {
                await actions.updateGoal(id, updates)
                loadData()
              }}
              onDeleteGoal={async (id) => {
                await actions.deleteGoal(id)
                loadData()
              }}
              onParseGoals={actions.parseGoalsAction}
              onCreateTask={async (task) => {
                await actions.createTask(task)
                loadData()
              }}
              onCreateHabit={async (habit) => {
                await actions.createHabit(habit)
                loadData()
              }}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <NutritionLogger
              entries={nutrition}
              meals={meals}
              macroGoals={userSettings?.macro_goals || null}
              userId={userId}
              onAdd={async (item) => {
                await actions.createNutrition(item)
                loadData()
              }}
              onDelete={async (id) => {
                await actions.deleteNutrition(id)
                loadData()
              }}
              onParse={actions.parseNutritionAction}
              onCreateMeal={async (meal) => {
                await actions.createMeal(meal)
                loadData()
              }}
              onDeleteMeal={async (id) => {
                await actions.deleteMeal(id)
                loadData()
              }}
            />

            <FitnessLogger
              entries={fitness}
              userId={userId}
              onAdd={async (item) => {
                await actions.createFitness(item)
                loadData()
              }}
              onDelete={async (id) => {
                await actions.deleteFitness(id)
                loadData()
              }}
              onParse={actions.parseFitnessAction}
            />

            <ReflectionsNotes
              reflections={reflections}
              notes={notes}
              improvements={improvements}
              values={values}
              themeSummary={themeSummary}
              userId={userId}
              customValues={customValues}
              onCreateReflection={async (reflection) => {
                await actions.createReflection(reflection)
                loadData()
              }}
              onCreateNote={async (note) => {
                await actions.createNote(note)
                loadData()
              }}
              onUpdateNote={async (id, updates) => {
                await actions.updateNote(id, updates)
                loadData()
              }}
              onDeleteNote={async (id) => {
                await actions.deleteNote(id)
                loadData()
              }}
              onCreateImprovement={async (improvement) => {
                await actions.createImprovement(improvement)
                loadData()
              }}
              onUpdateImprovement={async (id, updates) => {
                await actions.updateImprovement(id, updates)
                loadData()
              }}
              onBatchUpdateValues={async (ratings) => {
                await actions.batchUpsertValues(userId, ratings)
                loadData()
              }}
            />

            <JournalWriter
              journal={journal}
              pastJournals={pastJournals}
              userId={userId}
              selectedDate={selectedDate}
              onSave={async (journalEntry) => {
                await actions.upsertJournal(journalEntry)
                // Refresh journal data
                const updated = await actions.getJournal(userId, selectedDate)
                setJournal(updated)
              }}
            />
          </div>
        </div>
      </div>

      {/* Day Flow Manager - Morning/Evening Routines */}
      <DayFlowManager
        tasks={tasks}
        habits={habits}
        goals={goals}
        timeBlocks={timeBlocks}
        values={values}
        userId={userId}
        customValues={customValues}
        onCompleteHabit={async (id) => {
          await actions.completeHabit(id)
          loadData()
        }}
        onBatchUpdateValues={async (ratings) => {
          await actions.batchUpsertValues(userId, ratings)
          loadData()
        }}
        onCreateReflection={async (reflection) => {
          await actions.createReflection(reflection)
          loadData()
        }}
      />

      {/* Quick Actions FAB */}
      <QuickActions
        habits={habits}
        userId={userId}
        onCompleteHabit={async (id) => {
          await actions.completeHabit(id)
          loadData()
        }}
        onQuickTask={async (task) => {
          await actions.createTask(task)
          loadData()
        }}
        onQuickNote={async (content) => {
          await actions.createNote({
            user_id: userId,
            content,
            timestamp: new Date().toISOString(),
          })
          loadData()
        }}
      />
    </main>
  )
}
