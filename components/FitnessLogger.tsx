'use client'

import { useState } from 'react'
import type { Fitness } from '@/lib/types'

interface FitnessLoggerProps {
  entries: Fitness[]
  selectedDate: string
  onAdd: (fitness: Omit<Fitness, 'id' | 'created_at'>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onParse: (input: string) => Promise<Partial<Fitness>[]>
  userId: string
}

export default function FitnessLogger({
  entries,
  selectedDate,
  onAdd,
  onDelete,
  onParse,
  userId,
}: FitnessLoggerProps) {
  const [input, setInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<Partial<Fitness>[]>([])
  const [manualMode, setManualMode] = useState(false)
  const [manualEntry, setManualEntry] = useState({
    exercise_name: '',
    sets: '',
    reps: '',
    weight: '',
    cardio_minutes: '',
  })

  const handleParse = async () => {
    if (!input.trim()) return
    setParsing(true)
    try {
      const result = await onParse(input)
      setParsed(result)
    } finally {
      setParsing(false)
    }
  }

  const handleAdd = async (item: Partial<Fitness>) => {
    if (!item.exercise_name) return
    const timestamp = new Date(selectedDate + 'T' + new Date().toTimeString().slice(0, 8)).toISOString()
    await onAdd({
      user_id: userId,
      exercise_name: item.exercise_name,
      sets: item.sets || null,
      reps: item.reps || null,
      weight: item.weight || null,
      cardio_minutes: item.cardio_minutes || null,
      timestamp,
    })
    setParsed(parsed.filter((p) => p !== item))
    if (parsed.length === 1) {
      setInput('')
    }
  }

  const handleManualAdd = async () => {
    if (!manualEntry.exercise_name.trim()) return
    const timestamp = new Date(selectedDate + 'T' + new Date().toTimeString().slice(0, 8)).toISOString()
    await onAdd({
      user_id: userId,
      exercise_name: manualEntry.exercise_name,
      sets: manualEntry.sets ? Number(manualEntry.sets) : null,
      reps: manualEntry.reps ? Number(manualEntry.reps) : null,
      weight: manualEntry.weight ? Number(manualEntry.weight) : null,
      cardio_minutes: manualEntry.cardio_minutes ? Number(manualEntry.cardio_minutes) : null,
      timestamp,
    })
    setManualEntry({ exercise_name: '', sets: '', reps: '', weight: '', cardio_minutes: '' })
    setManualMode(false)
  }

  const totalVolume = entries.reduce((acc, e) => {
    if (e.sets && e.reps && e.weight) {
      return acc + e.sets * e.reps * e.weight
    }
    return acc
  }, 0)

  const totalCardio = entries.reduce((acc, e) => acc + (e.cardio_minutes || 0), 0)

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-3">Fitness</h2>

      {/* Daily Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{entries.length}</p>
          <p className="text-xs text-gray-500">Exercises</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{totalVolume.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Volume (lbs)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{totalCardio}</p>
          <p className="text-xs text-gray-500">Cardio (min)</p>
        </div>
      </div>

      {/* Input */}
      {!manualMode ? (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bench press 3x10 @ 135, 30 min run..."
            className="flex-1 border rounded-lg p-2"
          />
          <button
            onClick={handleParse}
            disabled={parsing || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {parsing ? '...' : 'Parse'}
          </button>
          <button
            onClick={() => setManualMode(true)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Manual
          </button>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-3">
          <input
            type="text"
            value={manualEntry.exercise_name}
            onChange={(e) => setManualEntry({ ...manualEntry, exercise_name: e.target.value })}
            placeholder="Exercise name"
            className="w-full border rounded p-2"
          />
          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              value={manualEntry.sets}
              onChange={(e) => setManualEntry({ ...manualEntry, sets: e.target.value })}
              placeholder="Sets"
              className="border rounded p-2"
            />
            <input
              type="number"
              value={manualEntry.reps}
              onChange={(e) => setManualEntry({ ...manualEntry, reps: e.target.value })}
              placeholder="Reps"
              className="border rounded p-2"
            />
            <input
              type="number"
              value={manualEntry.weight}
              onChange={(e) => setManualEntry({ ...manualEntry, weight: e.target.value })}
              placeholder="Weight"
              className="border rounded p-2"
            />
            <input
              type="number"
              value={manualEntry.cardio_minutes}
              onChange={(e) => setManualEntry({ ...manualEntry, cardio_minutes: e.target.value })}
              placeholder="Cardio min"
              className="border rounded p-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setManualMode(false)}
              className="flex-1 px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleManualAdd}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Parsed Items */}
      {parsed.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium mb-2">Parsed Exercises:</p>
          <div className="space-y-2">
            {parsed.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-2 rounded">
                <div>
                  <span className="font-medium">{item.exercise_name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {item.cardio_minutes
                      ? `${item.cardio_minutes} min`
                      : `${item.sets}x${item.reps} @ ${item.weight}lbs`}
                  </span>
                </div>
                <button
                  onClick={() => handleAdd(item)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entries */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {entries.length === 0 && (
          <p className="text-gray-400 text-center py-4">No exercises today</p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-2 border rounded"
          >
            <div>
              <p className="font-medium">{entry.exercise_name}</p>
              <p className="text-xs text-gray-500">
                {entry.cardio_minutes
                  ? `${entry.cardio_minutes} minutes cardio`
                  : `${entry.sets} sets × ${entry.reps} reps @ ${entry.weight} lbs`}
              </p>
            </div>
            <button
              onClick={() => onDelete(entry.id)}
              className="text-gray-400 hover:text-red-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
