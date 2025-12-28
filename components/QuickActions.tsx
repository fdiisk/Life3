'use client'

import { useState } from 'react'
import type { Habit, Task } from '@/lib/types'

interface QuickActionsProps {
  habits: Habit[]
  userId: string
  onCompleteHabit: (id: string) => Promise<void>
  onQuickTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<void>
  onQuickNote: (content: string) => Promise<void>
}

export default function QuickActions({
  habits,
  userId,
  onCompleteHabit,
  onQuickTask,
  onQuickNote,
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'menu' | 'task' | 'note' | 'habit'>('menu')
  const [taskInput, setTaskInput] = useState('')
  const [noteInput, setNoteInput] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const pendingHabits = habits.filter((h) => h.last_done !== today)

  const handleAddTask = async () => {
    if (!taskInput.trim()) return
    await onQuickTask({
      user_id: userId,
      title: taskInput,
      goal_id: null,
      due_date: today,
      completed: false,
    })
    setTaskInput('')
    setMode('menu')
    setIsOpen(false)
  }

  const handleAddNote = async () => {
    if (!noteInput.trim()) return
    await onQuickNote(noteInput)
    setNoteInput('')
    setMode('menu')
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition flex items-center justify-center text-2xl z-40"
      >
        +
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-slide-up">
        {mode === 'menu' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Quick Add</h2>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setMode('task')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                <span className="text-3xl">✅</span>
                <span className="text-sm font-medium text-blue-700">Task</span>
              </button>
              <button
                onClick={() => setMode('habit')}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
              >
                <span className="text-3xl">🔥</span>
                <span className="text-sm font-medium text-green-700">Habit</span>
              </button>
              <button
                onClick={() => setMode('note')}
                className="flex flex-col items-center gap-2 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition"
              >
                <span className="text-3xl">📝</span>
                <span className="text-sm font-medium text-yellow-700">Note</span>
              </button>
            </div>
          </>
        )}

        {mode === 'task' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Quick Task</h2>
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full border rounded-lg p-3 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setMode('menu')}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add Task
              </button>
            </div>
          </>
        )}

        {mode === 'habit' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Complete Habit</h2>
            {pendingHabits.length === 0 ? (
              <p className="text-gray-500 text-center py-4">All habits done for today! 🎉</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {pendingHabits.map((habit) => (
                  <button
                    key={habit.id}
                    onClick={async () => {
                      await onCompleteHabit(habit.id)
                      setMode('menu')
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition text-left"
                  >
                    <span className="text-xl">⬜</span>
                    <div>
                      <span className="font-medium">{habit.name}</span>
                      <span className="text-sm text-gray-400 ml-2">
                        🔥 {habit.streak}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setMode('menu')}
              className="w-full mt-4 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          </>
        )}

        {mode === 'note' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Quick Note</h2>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Capture your thought..."
              className="w-full border rounded-lg p-3 mb-4 h-24 resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setMode('menu')}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleAddNote}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Save Note
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => {
            setMode('menu')
            setIsOpen(false)
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
