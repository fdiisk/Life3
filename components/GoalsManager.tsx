'use client'

import { useState } from 'react'
import type { Goal, Task, Habit } from '@/lib/types'

interface GoalsManagerProps {
  goals: Goal[]
  tasks: Task[]
  habits: Habit[]
  onCreateGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'completed'>) => Promise<void>
  onUpdateGoal: (id: string, updates: Partial<Goal>) => Promise<void>
  onDeleteGoal: (id: string) => Promise<void>
  onParseGoals: (input: string) => Promise<{
    goals: Partial<Goal>[]
    tasks: { title: string; goal_index: number }[]
    habits: { name: string; frequency: string; goal_index: number }[]
  }>
  onCreateTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<void>
  onCreateHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'streak' | 'last_done'>) => Promise<void>
  userId: string
}

export default function GoalsManager({
  goals,
  tasks,
  habits,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onParseGoals,
  onCreateTask,
  onCreateHabit,
  userId,
}: GoalsManagerProps) {
  const [input, setInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: '', parent_goal_id: '', weight: '50' })

  const handleParse = async () => {
    if (!input.trim()) return
    setParsing(true)
    try {
      const result = await onParseGoals(input)

      // Create goals and get their IDs
      const goalIds: string[] = []
      for (const goal of result.goals) {
        if (goal.title) {
          await onCreateGoal({
            user_id: userId,
            title: goal.title,
            parent_goal_id: goal.parent_goal_id || null,
            weight: goal.weight || 50,
          })
          // In a real app, we'd get the created ID back
        }
      }

      setInput('')
    } finally {
      setParsing(false)
    }
  }

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) return
    await onCreateGoal({
      user_id: userId,
      title: newGoal.title,
      parent_goal_id: newGoal.parent_goal_id || null,
      weight: Number(newGoal.weight),
    })
    setNewGoal({ title: '', parent_goal_id: '', weight: '50' })
    setShowAddModal(false)
  }

  // Build goal tree
  const topLevelGoals = goals.filter((g) => !g.parent_goal_id)
  const getSubGoals = (parentId: string) => goals.filter((g) => g.parent_goal_id === parentId)
  const getGoalTasks = (goalId: string) => tasks.filter((t) => t.goal_id === goalId)

  const calculateProgress = (goalId: string): number => {
    const goalTasks = getGoalTasks(goalId)
    const subGoals = getSubGoals(goalId)

    if (goalTasks.length === 0 && subGoals.length === 0) return 0

    let totalWeight = 0
    let completedWeight = 0

    // Tasks contribute 50% to progress
    if (goalTasks.length > 0) {
      const taskProgress = goalTasks.filter((t) => t.completed).length / goalTasks.length
      totalWeight += 50
      completedWeight += taskProgress * 50
    }

    // Sub-goals contribute 50%
    if (subGoals.length > 0) {
      const subGoalProgress = subGoals.reduce((acc, sg) => acc + calculateProgress(sg.id), 0) / subGoals.length
      totalWeight += 50
      completedWeight += subGoalProgress * 0.5
    }

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Goals</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-blue-500 hover:text-blue-600"
        >
          + Add Goal
        </button>
      </div>

      {/* AI Parse Input */}
      <div className="mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your goals... e.g., 'I want to get fit by going to the gym 3x/week and eating healthy. My main goal is to lose 20 lbs by summer.'"
          className="w-full border rounded-lg p-3 h-20 resize-none"
        />
        <button
          onClick={handleParse}
          disabled={parsing || !input.trim()}
          className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
        >
          {parsing ? 'Parsing...' : 'Parse Goals with AI'}
        </button>
      </div>

      {/* Goals Tree */}
      <div className="space-y-3">
        {topLevelGoals.length === 0 && (
          <p className="text-gray-400 text-center py-4">No goals yet</p>
        )}
        {topLevelGoals.map((goal) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            progress={calculateProgress(goal.id)}
            subGoals={getSubGoals(goal.id)}
            tasks={getGoalTasks(goal.id)}
            allGoals={goals}
            onUpdate={onUpdateGoal}
            onDelete={onDeleteGoal}
            getSubGoals={getSubGoals}
            getGoalTasks={getGoalTasks}
            calculateProgress={calculateProgress}
          />
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full border rounded p-2"
                  placeholder="Goal title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Parent Goal</label>
                <select
                  value={newGoal.parent_goal_id}
                  onChange={(e) => setNewGoal({ ...newGoal, parent_goal_id: e.target.value })}
                  className="w-full border rounded p-2"
                >
                  <option value="">None (Top Level)</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (Importance)</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={newGoal.weight}
                  onChange={(e) => setNewGoal({ ...newGoal, weight: e.target.value })}
                  className="w-full"
                />
                <p className="text-center text-sm text-gray-500">{newGoal.weight}%</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GoalItem({
  goal,
  progress,
  subGoals,
  tasks,
  allGoals,
  onUpdate,
  onDelete,
  getSubGoals,
  getGoalTasks,
  calculateProgress,
}: {
  goal: Goal
  progress: number
  subGoals: Goal[]
  tasks: Task[]
  allGoals: Goal[]
  onUpdate: (id: string, updates: Partial<Goal>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  getSubGoals: (id: string) => Goal[]
  getGoalTasks: (id: string) => Task[]
  calculateProgress: (id: string) => number
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600"
        >
          {expanded ? '▼' : '▶'}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={goal.completed}
              onChange={() => onUpdate(goal.id, { completed: !goal.completed })}
              className="rounded"
            />
            <span className={goal.completed ? 'line-through text-gray-500' : 'font-medium'}>
              {goal.title}
            </span>
            <span className="text-xs text-gray-400">({goal.weight}%)</span>
          </div>
          <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-gray-600">{progress}%</span>
        <button
          onClick={() => onDelete(goal.id)}
          className="text-gray-400 hover:text-red-500"
        >
          ×
        </button>
      </div>

      {expanded && (
        <div className="mt-3 ml-6 space-y-2">
          {/* Sub-goals */}
          {subGoals.map((sg) => (
            <GoalItem
              key={sg.id}
              goal={sg}
              progress={calculateProgress(sg.id)}
              subGoals={getSubGoals(sg.id)}
              tasks={getGoalTasks(sg.id)}
              allGoals={allGoals}
              onUpdate={onUpdate}
              onDelete={onDelete}
              getSubGoals={getSubGoals}
              getGoalTasks={getGoalTasks}
              calculateProgress={calculateProgress}
            />
          ))}

          {/* Linked tasks */}
          {tasks.length > 0 && (
            <div className="pl-4 border-l-2 border-blue-200">
              <p className="text-xs text-gray-400 mb-1">Tasks:</p>
              {tasks.map((task) => (
                <div key={task.id} className="text-sm flex items-center gap-2">
                  <span className={task.completed ? 'text-gray-400 line-through' : ''}>
                    • {task.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
