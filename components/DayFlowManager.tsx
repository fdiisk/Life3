'use client'

import { useState } from 'react'
import MorningRoutine from './MorningRoutine'
import EveningCloseOut from './EveningCloseOut'
import type { Task, Habit, Goal, TimeBlock, Value, Reflection } from '@/lib/types'

interface DayFlowManagerProps {
  tasks: Task[]
  habits: Habit[]
  goals: Goal[]
  timeBlocks: TimeBlock[]
  values: Value[]
  userId: string
  customValues?: string[]
  onCompleteHabit: (id: string) => Promise<void>
  onBatchUpdateValues: (ratings: Record<string, number>) => Promise<void>
  onCreateReflection: (reflection: Omit<Reflection, 'id' | 'created_at'>) => Promise<void>
}

type FlowState = 'none' | 'morning' | 'evening'

export default function DayFlowManager({
  tasks,
  habits,
  goals,
  timeBlocks,
  values,
  userId,
  customValues,
  onCompleteHabit,
  onBatchUpdateValues,
  onCreateReflection,
}: DayFlowManagerProps) {
  const [flowState, setFlowState] = useState<FlowState>('none')

  const today = new Date().toISOString().split('T')[0]
  const storageKey = `life3_flow_${today}`

  // No auto-popup - only manual triggering via buttons

  const completeFlow = (flow: 'morning' | 'evening') => {
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}')
      stored[flow] = true
      localStorage.setItem(storageKey, JSON.stringify(stored))
    }
    setFlowState('none')
  }

  if (flowState === 'morning') {
    return (
      <MorningRoutine
        habits={habits}
        goals={goals}
        values={values}
        userId={userId}
        customValues={customValues}
        onCompleteHabit={onCompleteHabit}
        onBatchUpdateValues={onBatchUpdateValues}
        onComplete={() => completeFlow('morning')}
      />
    )
  }

  if (flowState === 'evening') {
    return (
      <EveningCloseOut
        tasks={tasks}
        habits={habits}
        goals={goals}
        timeBlocks={timeBlocks}
        values={values}
        userId={userId}
        customValues={customValues}
        onCreateReflection={onCreateReflection}
        onBatchUpdateValues={onBatchUpdateValues}
        onComplete={() => completeFlow('evening')}
      />
    )
  }

  // Quick actions buttons for triggering flows manually
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-40">
      <button
        onClick={() => setFlowState('morning')}
        className="px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition flex items-center gap-2"
      >
        <span>☀️</span>
        <span className="hidden sm:inline">Morning</span>
      </button>
      <button
        onClick={() => setFlowState('evening')}
        className="px-4 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
      >
        <span>🌙</span>
        <span className="hidden sm:inline">Evening</span>
      </button>
    </div>
  )
}
