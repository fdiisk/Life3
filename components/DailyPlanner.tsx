'use client'

import { useState } from 'react'
import type { TimeBlock, Task, Habit, LifeArea } from '@/lib/types'
import { LIFE_AREA_COLORS } from '@/lib/types'

interface DailyPlannerProps {
  timeBlocks: TimeBlock[]
  tasks: Task[]
  habits: Habit[]
  onCreateBlock: (block: Omit<TimeBlock, 'id' | 'created_at'>) => Promise<void>
  onDeleteBlock: (id: string) => Promise<void>
  onCompleteTask: (id: string) => Promise<void>
  onCompleteHabit: (id: string) => Promise<void>
  userId: string
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6 AM to 10 PM

export default function DailyPlanner({
  timeBlocks,
  tasks,
  habits,
  onCreateBlock,
  onDeleteBlock,
  onCompleteTask,
  onCompleteHabit,
  userId,
}: DailyPlannerProps) {
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [newBlock, setNewBlock] = useState<{
    type: LifeArea
    duration: number
    linkedTaskId: string | null
    linkedHabitId: string | null
  }>({
    type: 'work',
    duration: 60,
    linkedTaskId: null,
    linkedHabitId: null,
  })

  const getBlocksForHour = (hour: number) => {
    return timeBlocks.filter((block) => {
      const blockHour = new Date(block.start_time).getHours()
      return blockHour === hour
    })
  }

  const handleAddBlock = async () => {
    if (selectedHour === null) return

    const startTime = new Date(selectedDate)
    startTime.setHours(selectedHour, 0, 0, 0)

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + newBlock.duration)

    await onCreateBlock({
      user_id: userId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      type: newBlock.type,
      linked_task_id: newBlock.linkedTaskId,
      linked_habit_id: newBlock.linkedHabitId,
    })

    setShowModal(false)
    setSelectedHour(null)
  }

  const uncompletedTasks = tasks.filter((t) => !t.completed)
  const todayHabits = habits.filter((h) => {
    const lastDone = h.last_done ? new Date(h.last_done).toISOString().split('T')[0] : null
    return lastDone !== selectedDate
  })

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Daily Planner</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Time Grid */}
        <div className="lg:col-span-2">
          <div className="border rounded-lg overflow-hidden">
            {HOURS.map((hour) => {
              const blocks = getBlocksForHour(hour)
              return (
                <div
                  key={hour}
                  className="flex border-b last:border-b-0 min-h-[48px]"
                >
                  <div className="w-16 p-2 text-sm text-gray-500 bg-gray-50 flex-shrink-0">
                    {hour % 12 || 12} {hour < 12 ? 'AM' : 'PM'}
                  </div>
                  <div
                    className="flex-1 p-1 cursor-pointer hover:bg-gray-50 flex flex-wrap gap-1"
                    onClick={() => {
                      setSelectedHour(hour)
                      setShowModal(true)
                    }}
                  >
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        className={`${LIFE_AREA_COLORS[block.type]} text-white px-2 py-1 rounded text-sm flex items-center gap-1`}
                      >
                        <span className="capitalize">{block.type}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteBlock(block.id)
                          }}
                          className="ml-1 hover:opacity-70"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Unscheduled Items */}
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Uncompleted Tasks</h3>
            <div className="space-y-1">
              {uncompletedTasks.length === 0 && (
                <p className="text-sm text-gray-400">No tasks</p>
              )}
              {uncompletedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    onChange={() => onCompleteTask(task.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{task.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Today&apos;s Habits</h3>
            <div className="space-y-1">
              {todayHabits.length === 0 && (
                <p className="text-sm text-gray-400">All done!</p>
              )}
              {todayHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    onChange={() => onCompleteHabit(habit.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{habit.name}</span>
                  <span className="text-xs text-orange-500 ml-auto">
                    🔥 {habit.streak}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Block Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Add Block at {selectedHour! % 12 || 12} {selectedHour! < 12 ? 'AM' : 'PM'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newBlock.type}
                  onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value as LifeArea })}
                  className="w-full border rounded p-2"
                >
                  <option value="work">Work</option>
                  <option value="health">Health</option>
                  <option value="personal">Personal</option>
                  <option value="learning">Learning</option>
                  <option value="social">Social</option>
                  <option value="rest">Rest</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <select
                  value={newBlock.duration}
                  onChange={(e) => setNewBlock({ ...newBlock, duration: Number(e.target.value) })}
                  className="w-full border rounded p-2"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Link to Task</label>
                <select
                  value={newBlock.linkedTaskId || ''}
                  onChange={(e) => setNewBlock({
                    ...newBlock,
                    linkedTaskId: e.target.value || null,
                    linkedHabitId: null,
                  })}
                  className="w-full border rounded p-2"
                >
                  <option value="">None</option>
                  {uncompletedTasks.map((task) => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Link to Habit</label>
                <select
                  value={newBlock.linkedHabitId || ''}
                  onChange={(e) => setNewBlock({
                    ...newBlock,
                    linkedHabitId: e.target.value || null,
                    linkedTaskId: null,
                  })}
                  className="w-full border rounded p-2"
                >
                  <option value="">None</option>
                  {habits.map((habit) => (
                    <option key={habit.id} value={habit.id}>{habit.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBlock}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
