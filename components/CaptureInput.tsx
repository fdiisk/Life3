'use client'

import { useState } from 'react'
import { parseInput, saveParsedInput } from '@/actions/capture'
import type { ParsedInput } from '@/lib/types'

interface CaptureInputProps {
  userId: string
  onSave?: () => void
}

export default function CaptureInput({ userId, onSave }: CaptureInputProps) {
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<ParsedInput | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleParse = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      const result = await parseInput(input)
      setParsed(result)
    } catch (error) {
      console.error('Parse error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!parsed) return
    setSaving(true)
    try {
      await saveParsedInput(userId, parsed)
      setInput('')
      setParsed(null)
      onSave?.()
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const removeItem = (category: keyof ParsedInput, index: number) => {
    if (!parsed) return
    setParsed({
      ...parsed,
      [category]: parsed[category].filter((_, i) => i !== index),
    })
  }

  const hasItems = parsed && (
    parsed.tasks.length > 0 ||
    parsed.habits.length > 0 ||
    parsed.goals.length > 0 ||
    parsed.nutrition.length > 0 ||
    parsed.fitness.length > 0 ||
    parsed.notes.length > 0
  )

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-3">Quick Capture</h2>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type anything... tasks, meals, workouts, notes, goals"
        className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleParse}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Parsing...' : 'Parse'}
        </button>

        {hasItems && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
        )}
      </div>

      {parsed && (
        <div className="mt-4 space-y-3">
          {parsed.tasks.length > 0 && (
            <ParsedSection
              title="Tasks"
              items={parsed.tasks.map(t => t.title || '')}
              color="blue"
              onRemove={(i) => removeItem('tasks', i)}
            />
          )}

          {parsed.habits.length > 0 && (
            <ParsedSection
              title="Habits"
              items={parsed.habits.map(h => `${h.name} (${h.frequency})`)}
              color="purple"
              onRemove={(i) => removeItem('habits', i)}
            />
          )}

          {parsed.goals.length > 0 && (
            <ParsedSection
              title="Goals"
              items={parsed.goals.map(g => g.title || '')}
              color="yellow"
              onRemove={(i) => removeItem('goals', i)}
            />
          )}

          {parsed.nutrition.length > 0 && (
            <ParsedSection
              title="Nutrition"
              items={parsed.nutrition.map(n => {
                const m = n.macros || {}
                return `${n.food_name} (${m.calories || '?'}cal)`
              })}
              color="green"
              onRemove={(i) => removeItem('nutrition', i)}
            />
          )}

          {parsed.fitness.length > 0 && (
            <ParsedSection
              title="Fitness"
              items={parsed.fitness.map(f => {
                if (f.cardio_minutes) return `${f.exercise_name} - ${f.cardio_minutes}min`
                return `${f.exercise_name} - ${f.sets}x${f.reps} @ ${f.weight}lbs`
              })}
              color="red"
              onRemove={(i) => removeItem('fitness', i)}
            />
          )}

          {parsed.notes.length > 0 && (
            <ParsedSection
              title="Notes"
              items={parsed.notes.map(n => n.content?.substring(0, 50) + '...' || '')}
              color="gray"
              onRemove={(i) => removeItem('notes', i)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ParsedSection({
  title,
  items,
  color,
  onRemove,
}: {
  title: string
  items: string[]
  color: string
  onRemove: (index: number) => void
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 ${colorClasses[color]}`}
          >
            {item}
            <button
              onClick={() => onRemove(i)}
              className="ml-1 hover:opacity-70"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
