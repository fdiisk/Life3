'use client'

import { useState } from 'react'
import type { Nutrition } from '@/lib/types'

interface NutritionLoggerProps {
  entries: Nutrition[]
  onAdd: (nutrition: Omit<Nutrition, 'id' | 'created_at'>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onParse: (input: string) => Promise<Partial<Nutrition>[]>
  userId: string
}

export default function NutritionLogger({
  entries,
  onAdd,
  onDelete,
  onParse,
  userId,
}: NutritionLoggerProps) {
  const [input, setInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<Partial<Nutrition>[]>([])

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

  const handleAdd = async (item: Partial<Nutrition>) => {
    if (!item.food_name) return
    await onAdd({
      user_id: userId,
      food_name: item.food_name,
      macros: item.macros || {},
      timestamp: new Date().toISOString(),
    })
    setParsed(parsed.filter((p) => p !== item))
    if (parsed.length === 1) {
      setInput('')
    }
  }

  const handleAddManual = async () => {
    if (!input.trim()) return
    await onAdd({
      user_id: userId,
      food_name: input,
      macros: {},
      timestamp: new Date().toISOString(),
    })
    setInput('')
  }

  const totalMacros = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.macros?.calories || 0),
      protein: acc.protein + (entry.macros?.protein || 0),
      carbs: acc.carbs + (entry.macros?.carbs || 0),
      fat: acc.fat + (entry.macros?.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-3">Nutrition</h2>

      {/* Daily Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-green-50 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{totalMacros.calories}</p>
          <p className="text-xs text-gray-500">Calories</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{totalMacros.protein}g</p>
          <p className="text-xs text-gray-500">Protein</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{totalMacros.carbs}g</p>
          <p className="text-xs text-gray-500">Carbs</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{totalMacros.fat}g</p>
          <p className="text-xs text-gray-500">Fat</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="2 eggs, toast with butter, coffee..."
          className="flex-1 border rounded-lg p-2"
        />
        <button
          onClick={handleParse}
          disabled={parsing || !input.trim()}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {parsing ? '...' : 'Parse'}
        </button>
        <button
          onClick={handleAddManual}
          disabled={!input.trim()}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Quick Add
        </button>
      </div>

      {/* Parsed Items */}
      {parsed.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium mb-2">Parsed Foods:</p>
          <div className="space-y-2">
            {parsed.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-2 rounded">
                <div>
                  <span className="font-medium">{item.food_name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {item.macros?.calories || '?'} cal
                  </span>
                </div>
                <button
                  onClick={() => handleAdd(item)}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
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
          <p className="text-gray-400 text-center py-4">No entries today</p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-2 border rounded"
          >
            <div>
              <p className="font-medium">{entry.food_name}</p>
              <div className="text-xs text-gray-500 flex gap-3">
                {entry.macros?.calories && <span>{entry.macros.calories} cal</span>}
                {entry.macros?.protein && <span>{entry.macros.protein}g protein</span>}
                {entry.macros?.carbs && <span>{entry.macros.carbs}g carbs</span>}
                {entry.macros?.fat && <span>{entry.macros.fat}g fat</span>}
              </div>
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
