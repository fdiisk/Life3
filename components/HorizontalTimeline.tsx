'use client'

import { useState, useRef, useEffect } from 'react'
import type { TimeBlock, Task, Habit, LifeArea } from '@/lib/types'
import { LIFE_AREA_COLORS } from '@/lib/types'

interface HorizontalTimelineProps {
  timeBlocks: TimeBlock[]
  tasks: Task[]
  habits: Habit[]
  onCreateBlock: (block: Omit<TimeBlock, 'id' | 'created_at'>) => Promise<void>
  onDeleteBlock: (id: string) => Promise<void>
  onCompleteTask: (id: string) => Promise<void>
  onCompleteHabit: (id: string) => Promise<void>
  userId: string
  onClose: () => void
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6 AM to 10 PM
const HOUR_WIDTH = 120 // pixels per hour

export default function HorizontalTimeline({
  timeBlocks,
  tasks,
  habits,
  onCreateBlock,
  onDeleteBlock,
  onCompleteTask,
  onCompleteHabit,
  userId,
  onClose,
}: HorizontalTimelineProps) {
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

  const timelineRef = useRef<HTMLDivElement>(null)
  const currentHour = new Date().getHours()

  // Scroll to current hour on mount
  useEffect(() => {
    if (timelineRef.current) {
      const scrollPos = (currentHour - 6) * HOUR_WIDTH - window.innerWidth / 2 + HOUR_WIDTH / 2
      timelineRef.current.scrollLeft = Math.max(0, scrollPos)
    }
  }, [currentHour])

  const getBlockStyle = (block: TimeBlock) => {
    const startTime = new Date(block.start_time)
    const endTime = new Date(block.end_time)
    const startHour = startTime.getHours() + startTime.getMinutes() / 60
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

    const left = (startHour - 6) * HOUR_WIDTH
    const width = duration * HOUR_WIDTH

    return {
      left: `${left}px`,
      width: `${Math.max(width, 30)}px`,
    }
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

  const getLinkedInfo = (block: TimeBlock) => {
    if (block.linked_task_id) {
      const task = tasks.find(t => t.id === block.linked_task_id)
      return task ? { type: 'task', name: task.title, completed: task.completed } : null
    }
    if (block.linked_habit_id) {
      const habit = habits.find(h => h.id === block.linked_habit_id)
      return habit ? { type: 'habit', name: habit.name, streak: habit.streak } : null
    }
    return null
  }

  // Calculate current time indicator position
  const now = new Date()
  const currentTimePos = (now.getHours() + now.getMinutes() / 60 - 6) * HOUR_WIDTH

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl"
          >
            &times;
          </button>
          <h1 className="text-xl font-bold text-white">Daily Timeline</h1>
          <span className="text-gray-400">
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
        <div className="flex gap-2">
          {(['work', 'health', 'personal', 'learning', 'social', 'rest'] as LifeArea[]).map((type) => (
            <span
              key={type}
              className={`${LIFE_AREA_COLORS[type]} px-3 py-1 rounded text-white text-xs capitalize`}
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Timeline */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={timelineRef}
            className="h-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600"
          >
            <div
              className="relative h-full"
              style={{ width: `${HOURS.length * HOUR_WIDTH}px`, minHeight: '100%' }}
            >
              {/* Hour Grid */}
              <div className="absolute inset-0 flex">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className={`flex-shrink-0 border-r border-gray-700 cursor-pointer transition-colors ${
                      hour === currentHour ? 'bg-gray-800' : 'hover:bg-gray-800/50'
                    }`}
                    style={{ width: `${HOUR_WIDTH}px` }}
                    onClick={() => {
                      setSelectedHour(hour)
                      setShowModal(true)
                    }}
                  >
                    <div className="p-2 text-sm text-gray-400 font-medium border-b border-gray-700 bg-gray-800/80 sticky top-0">
                      {hour % 12 || 12} {hour < 12 ? 'AM' : 'PM'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Time Indicator */}
              {currentHour >= 6 && currentHour <= 22 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                  style={{ left: `${currentTimePos}px` }}
                >
                  <div className="absolute -top-1 -left-2 w-4 h-4 rounded-full bg-red-500" />
                </div>
              )}

              {/* Time Blocks */}
              <div className="absolute top-12 left-0 right-0 bottom-0 px-2">
                {timeBlocks.map((block, index) => {
                  const linkedInfo = getLinkedInfo(block)
                  return (
                    <div
                      key={block.id}
                      className={`absolute ${LIFE_AREA_COLORS[block.type]} rounded-lg shadow-lg p-3 cursor-pointer hover:opacity-90 transition-all group`}
                      style={{
                        ...getBlockStyle(block),
                        top: `${8 + (index % 3) * 80}px`,
                        minHeight: '70px',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white capitalize text-sm">
                            {block.type}
                          </div>
                          {linkedInfo && (
                            <div className="text-white/80 text-xs mt-1 truncate">
                              {linkedInfo.type === 'task' && (
                                <span className={linkedInfo.completed ? 'line-through' : ''}>
                                  Task: {linkedInfo.name}
                                </span>
                              )}
                              {linkedInfo.type === 'habit' && (
                                <span>
                                  Habit: {linkedInfo.name} ({linkedInfo.streak} streak)
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-white/60 text-xs mt-1">
                            {new Date(block.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {' - '}
                            {new Date(block.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteBlock(block.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 text-white/80 hover:text-white ml-2 transition-opacity"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Uncompleted Tasks */}
            <div>
              <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Uncompleted Tasks
              </h3>
              <div className="space-y-2">
                {uncompletedTasks.length === 0 && (
                  <p className="text-sm text-gray-500">All tasks done!</p>
                )}
                {uncompletedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 p-2 bg-gray-700/50 rounded hover:bg-gray-700 transition"
                  >
                    <input
                      type="checkbox"
                      onChange={() => onCompleteTask(task.id)}
                      className="rounded accent-blue-500"
                    />
                    <span className="text-sm text-gray-300 flex-1">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Habits */}
            <div>
              <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Today&apos;s Habits
              </h3>
              <div className="space-y-2">
                {todayHabits.length === 0 && (
                  <p className="text-sm text-gray-500">All habits done!</p>
                )}
                {todayHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-2 p-2 bg-gray-700/50 rounded hover:bg-gray-700 transition"
                  >
                    <input
                      type="checkbox"
                      onChange={() => onCompleteHabit(habit.id)}
                      className="rounded accent-green-500"
                    />
                    <span className="text-sm text-gray-300 flex-1">{habit.name}</span>
                    <span className="text-xs text-orange-400">
                      {habit.streak} streak
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3">Today&apos;s Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Time Blocks</span>
                  <span className="text-white">{timeBlocks.length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Total Blocked Time</span>
                  <span className="text-white">
                    {timeBlocks.reduce((acc, block) => {
                      const start = new Date(block.start_time)
                      const end = new Date(block.end_time)
                      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                    }, 0).toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tasks Pending</span>
                  <span className="text-white">{uncompletedTasks.length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Habits Remaining</span>
                  <span className="text-white">{todayHabits.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Block Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Add Block at {selectedHour! % 12 || 12} {selectedHour! < 12 ? 'AM' : 'PM'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Type</label>
                <select
                  value={newBlock.type}
                  onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value as LifeArea })}
                  className="w-full border border-gray-600 rounded p-2 bg-gray-700 text-white"
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
                <label className="block text-sm font-medium mb-1 text-gray-300">Duration</label>
                <select
                  value={newBlock.duration}
                  onChange={(e) => setNewBlock({ ...newBlock, duration: Number(e.target.value) })}
                  className="w-full border border-gray-600 rounded p-2 bg-gray-700 text-white"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Link to Task</label>
                <select
                  value={newBlock.linkedTaskId || ''}
                  onChange={(e) => setNewBlock({
                    ...newBlock,
                    linkedTaskId: e.target.value || null,
                    linkedHabitId: null,
                  })}
                  className="w-full border border-gray-600 rounded p-2 bg-gray-700 text-white"
                >
                  <option value="">None</option>
                  {uncompletedTasks.map((task) => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Link to Habit</label>
                <select
                  value={newBlock.linkedHabitId || ''}
                  onChange={(e) => setNewBlock({
                    ...newBlock,
                    linkedHabitId: e.target.value || null,
                    linkedTaskId: null,
                  })}
                  className="w-full border border-gray-600 rounded p-2 bg-gray-700 text-white"
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
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-white"
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
