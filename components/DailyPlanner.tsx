'use client'

import { useState } from 'react'
import type { TimeBlock, Task, LifeArea } from '@/lib/types'
import { LIFE_AREA_COLORS } from '@/lib/types'

interface DailyPlannerProps {
  timeBlocks: TimeBlock[]
  tasks: Task[]
  onCreateBlock: (block: Omit<TimeBlock, 'id' | 'created_at'>) => Promise<void>
  onDeleteBlock: (id: string) => Promise<void>
  onCompleteTask: (id: string) => Promise<void>
  userId: string
  selectedDate: string
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 6 AM to 9 PM

export default function DailyPlanner({
  timeBlocks,
  tasks,
  onCreateBlock,
  onDeleteBlock,
  onCompleteTask,
  userId,
  selectedDate,
}: DailyPlannerProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [blockType, setBlockType] = useState<LifeArea>('work')

  const currentHour = new Date().getHours()
  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  // Get block for a specific hour (only one per hour)
  const getBlockForHour = (hour: number): TimeBlock | null => {
    return timeBlocks.find((block) => {
      const blockHour = new Date(block.start_time).getHours()
      return blockHour === hour
    }) || null
  }

  // Get task name for a block
  const getTaskName = (block: TimeBlock): string | null => {
    if (block.linked_task_id) {
      const task = tasks.find(t => t.id === block.linked_task_id)
      return task?.title || null
    }
    return null
  }

  const handleAssign = async () => {
    if (selectedHour === null) return

    const startTime = new Date(selectedDate)
    startTime.setHours(selectedHour, 0, 0, 0)

    const endTime = new Date(startTime)
    endTime.setHours(selectedHour + 1, 0, 0, 0)

    await onCreateBlock({
      user_id: userId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      type: blockType,
      linked_task_id: selectedTask || null,
      linked_habit_id: null,
    })

    setSelectedHour(null)
    setSelectedTask('')
  }

  const uncompletedTasks = tasks.filter((t) => !t.completed)

  // Calculate stats
  const blockedHours = timeBlocks.length
  const workHours = timeBlocks.filter(b => b.type === 'work').length

  return (
    <div className="bg-white rounded-lg shadow p-4 col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Timeline</h2>
          <p className="text-xs text-gray-500">
            {blockedHours} hours planned • {workHours} work
          </p>
        </div>
        <div className="flex gap-1 text-xs">
          {(['work', 'health', 'personal', 'learning'] as LifeArea[]).map((type) => (
            <span
              key={type}
              className={`${LIFE_AREA_COLORS[type]} px-2 py-0.5 rounded text-white capitalize`}
            >
              {type[0].toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Candle Bar Timeline */}
      <div className="relative">
        {/* Hour Labels */}
        <div className="flex border-b border-gray-200 mb-1">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex-1 text-center text-xs text-gray-400 pb-1"
            >
              {hour % 12 || 12}{hour < 12 ? 'a' : 'p'}
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="flex gap-1 h-24 items-end">
          {HOURS.map((hour) => {
            const block = getBlockForHour(hour)
            const isCurrentHour = isToday && hour === currentHour
            const isPast = isToday && hour < currentHour
            const taskName = block ? getTaskName(block) : null

            return (
              <div
                key={hour}
                className="flex-1 flex flex-col items-center relative group"
              >
                {/* Bar */}
                <button
                  onClick={() => {
                    if (block) {
                      onDeleteBlock(block.id)
                    } else {
                      setSelectedHour(hour)
                    }
                  }}
                  className={`w-full rounded-t transition-all ${
                    block
                      ? `${LIFE_AREA_COLORS[block.type]} hover:opacity-80`
                      : isPast
                        ? 'bg-gray-100'
                        : 'bg-gray-200 hover:bg-gray-300'
                  } ${isCurrentHour ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
                  style={{
                    height: block ? '100%' : (isPast ? '20%' : '40%'),
                    minHeight: '16px'
                  }}
                  title={block ? `${block.type}${taskName ? `: ${taskName}` : ''} - Click to remove` : 'Click to assign'}
                />

                {/* Current time indicator */}
                {isCurrentHour && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                )}

                {/* Tooltip on hover */}
                {block && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      {block.type}{taskName ? `: ${taskName}` : ''}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Current time line */}
        {isToday && currentHour >= 6 && currentHour <= 21 && (
          <div
            className="absolute top-6 bottom-0 w-0.5 bg-red-500 pointer-events-none"
            style={{
              left: `${((currentHour - 6) / HOURS.length) * 100 + (100 / HOURS.length / 2)}%`
            }}
          />
        )}
      </div>

      {/* Assignment Modal */}
      {selectedHour !== null && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm">
              Assign {selectedHour % 12 || 12}:00 {selectedHour < 12 ? 'AM' : 'PM'}
            </span>
            <button
              onClick={() => setSelectedHour(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="flex gap-2">
            {/* Type selector */}
            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value as LifeArea)}
              className="border rounded px-2 py-1.5 text-sm bg-white"
            >
              <option value="work">Work</option>
              <option value="health">Health</option>
              <option value="personal">Personal</option>
              <option value="learning">Learning</option>
              <option value="social">Social</option>
              <option value="rest">Rest</option>
            </select>

            {/* Task selector */}
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="flex-1 border rounded px-2 py-1.5 text-sm bg-white"
            >
              <option value="">No task linked</option>
              {uncompletedTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleAssign}
              className="px-4 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Assign
            </button>
          </div>
        </div>
      )}

      {/* Quick Task List */}
      {uncompletedTasks.length > 0 && (
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Quick complete:</p>
          <div className="flex flex-wrap gap-1">
            {uncompletedTasks.slice(0, 6).map((task) => (
              <button
                key={task.id}
                onClick={() => onCompleteTask(task.id)}
                className="px-2 py-1 bg-gray-100 hover:bg-green-100 rounded text-xs text-gray-600 hover:text-green-700 transition"
              >
                ✓ {task.title.length > 20 ? task.title.slice(0, 20) + '...' : task.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
