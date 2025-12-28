'use client'

import { useState } from 'react'
import type { Task, Habit, Goal } from '@/lib/types'

interface HabitsTasksProps {
  tasks: Task[]
  habits: Habit[]
  goals: Goal[]
  onCreateTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<void>
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
  onCreateHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'streak' | 'last_done'>) => Promise<void>
  onUpdateHabit: (id: string, updates: Partial<Habit>) => Promise<void>
  onDeleteHabit: (id: string) => Promise<void>
  onCompleteHabit: (id: string) => Promise<void>
  userId: string
}

export default function HabitsTasks({
  tasks,
  habits,
  goals,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCreateHabit,
  onUpdateHabit,
  onDeleteHabit,
  onCompleteHabit,
  userId,
}: HabitsTasksProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'habits'>('tasks')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', goal_id: '', due_date: '' })
  const [newHabit, setNewHabit] = useState({ name: '', frequency: 'daily' as const })
  const [showCompleted, setShowCompleted] = useState(false)

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return
    await onCreateTask({
      user_id: userId,
      title: newTask.title,
      goal_id: newTask.goal_id || null,
      due_date: newTask.due_date || null,
      completed: false,
    })
    setNewTask({ title: '', goal_id: '', due_date: '' })
    setShowAddModal(false)
  }

  const handleAddHabit = async () => {
    if (!newHabit.name.trim()) return
    await onCreateHabit({
      user_id: userId,
      name: newHabit.name,
      frequency: newHabit.frequency,
    })
    setNewHabit({ name: '', frequency: 'daily' })
    setShowAddModal(false)
  }

  const filteredTasks = showCompleted ? tasks : tasks.filter(t => !t.completed)
  const getGoalTitle = (goalId: string | null) => {
    if (!goalId) return null
    return goals.find(g => g.id === goalId)?.title
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-2 px-1 ${activeTab === 'tasks' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Tasks ({tasks.filter(t => !t.completed).length})
        </button>
        <button
          onClick={() => setActiveTab('habits')}
          className={`pb-2 px-1 ${activeTab === 'habits' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Habits ({habits.length})
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="ml-auto text-blue-500 hover:text-blue-600"
        >
          + Add
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded"
            />
            Show completed
          </label>

          <div className="space-y-2">
            {filteredTasks.length === 0 && (
              <p className="text-gray-400 text-center py-4">No tasks</p>
            )}
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${task.completed ? 'bg-gray-50 opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onUpdateTask(task.id, { completed: !task.completed })}
                  className="rounded"
                />
                <div className="flex-1">
                  <p className={task.completed ? 'line-through text-gray-500' : ''}>
                    {task.title}
                  </p>
                  <div className="flex gap-2 text-xs text-gray-400">
                    {task.due_date && (
                      <span className={task.due_date < today ? 'text-red-500' : ''}>
                        Due: {task.due_date}
                      </span>
                    )}
                    {getGoalTitle(task.goal_id) && (
                      <span>→ {getGoalTitle(task.goal_id)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habits Tab */}
      {activeTab === 'habits' && (
        <div className="space-y-2">
          {habits.length === 0 && (
            <p className="text-gray-400 text-center py-4">No habits</p>
          )}
          {habits.map((habit) => {
            const lastDone = habit.last_done ? new Date(habit.last_done).toISOString().split('T')[0] : null
            const doneToday = lastDone === today

            return (
              <div
                key={habit.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${doneToday ? 'bg-green-50 border-green-200' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={doneToday}
                  onChange={() => !doneToday && onCompleteHabit(habit.id)}
                  disabled={doneToday}
                  className="rounded"
                />
                <div className="flex-1">
                  <p className="font-medium">{habit.name}</p>
                  <div className="flex gap-2 text-xs text-gray-400">
                    <span className="capitalize">{habit.frequency}</span>
                    <span className="text-orange-500">🔥 {habit.streak} streak</span>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Add {activeTab === 'tasks' ? 'Task' : 'Habit'}
            </h3>

            {activeTab === 'tasks' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full border rounded p-2"
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Goal</label>
                  <select
                    value={newTask.goal_id}
                    onChange={(e) => setNewTask({ ...newTask, goal_id: e.target.value })}
                    className="w-full border rounded p-2"
                  >
                    <option value="">None</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>{goal.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    className="w-full border rounded p-2"
                    placeholder="Habit name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select
                    value={newHabit.frequency}
                    onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                    className="w-full border rounded p-2"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={activeTab === 'tasks' ? handleAddTask : handleAddHabit}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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
