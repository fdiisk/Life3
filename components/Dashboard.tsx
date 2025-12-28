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
import * as actions from '@/actions'
import type { Task, Habit, Goal, TimeBlock, Nutrition, Fitness, Value, Reflection, Note } from '@/lib/types'

interface DashboardProps {
  userId: string
}

export default function Dashboard({ userId }: DashboardProps) {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [nutrition, setNutrition] = useState<Nutrition[]>([])
  const [fitness, setFitness] = useState<Fitness[]>([])
  const [values, setValues] = useState<Value[]>([])
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [themeSummary, setThemeSummary] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const loadData = useCallback(async () => {
    try {
      const [
        tasksData,
        habitsData,
        goalsData,
        blocksData,
        nutritionData,
        fitnessData,
        valuesData,
        reflectionsData,
        notesData,
        summary,
      ] = await Promise.all([
        actions.getTasks(userId, true),
        actions.getHabits(userId),
        actions.getGoals(userId),
        actions.getTimeBlocks(userId, today),
        actions.getNutrition(userId, today),
        actions.getFitness(userId, today),
        actions.getValues(userId, today),
        actions.getReflections(userId),
        actions.getNotes(userId),
        actions.getThemeSummary(userId),
      ])

      setTasks(tasksData)
      setHabits(habitsData)
      setGoals(goalsData)
      setTimeBlocks(blocksData)
      setNutrition(nutritionData)
      setFitness(fitnessData)
      setValues(valuesData)
      setReflections(reflectionsData)
      setNotes(notesData)
      setThemeSummary(summary)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, today])

  useEffect(() => {
    loadData()
  }, [loadData])

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
        <header className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Life3</h1>
            <p className="text-gray-500">{new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</p>
          </div>
          <a
            href="/analytics"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
          >
            📊 Analytics
          </a>
        </header>

        {/* Quick Capture */}
        <div className="mb-6">
          <CaptureInput userId={userId} onSave={loadData} />
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
                await actions.createTimeBlock(block)
                loadData()
              }}
              onDeleteBlock={async (id) => {
                await actions.deleteTimeBlock(id)
                loadData()
              }}
              onCompleteTask={async (id) => {
                await actions.updateTask(id, { completed: true })
                loadData()
              }}
              onCompleteHabit={async (id) => {
                await actions.completeHabit(id)
                loadData()
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
              values={values}
              themeSummary={themeSummary}
              userId={userId}
              onCreateReflection={async (reflection) => {
                await actions.createReflection(reflection)
                loadData()
              }}
              onCreateNote={async (note) => {
                await actions.createNote(note)
                loadData()
              }}
              onDeleteNote={async (id) => {
                await actions.deleteNote(id)
                loadData()
              }}
              onUpdateValue={async (name, rating) => {
                await actions.upsertValue(userId, name, rating)
                loadData()
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
        onCompleteHabit={async (id) => {
          await actions.completeHabit(id)
          loadData()
        }}
        onUpdateValue={async (name, rating) => {
          await actions.upsertValue(userId, name, rating)
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
