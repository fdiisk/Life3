'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { Reflection, Note, Value } from '@/lib/types'
import { CORE_VALUES } from '@/lib/constants'

interface ReflectionsNotesProps {
  reflections: Reflection[]
  notes: Note[]
  values: Value[]
  themeSummary: string | null
  onCreateReflection: (reflection: Omit<Reflection, 'id' | 'created_at'>) => Promise<void>
  onCreateNote: (note: Omit<Note, 'id' | 'created_at'>) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
  onBatchUpdateValues: (ratings: Record<string, number>) => Promise<void>
  userId: string
  customValues?: string[]
}

export default function ReflectionsNotes({
  reflections,
  notes,
  values,
  themeSummary,
  onCreateReflection,
  onCreateNote,
  onDeleteNote,
  onBatchUpdateValues,
  userId,
  customValues,
}: ReflectionsNotesProps) {
  // Use custom values if provided, otherwise fall back to defaults
  const valuesList = customValues?.length ? customValues : [...CORE_VALUES]
  const [activeTab, setActiveTab] = useState<'reflection' | 'notes' | 'values'>('reflection')
  const [reflection, setReflection] = useState({ wentWell: '', evenBetterIf: '' })
  const [noteInput, setNoteInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [localRatings, setLocalRatings] = useState<Record<string, number>>({})
  const [valuesDirty, setValuesDirty] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize local ratings from server values
  useEffect(() => {
    const initial: Record<string, number> = {}
    valuesList.forEach((v) => {
      const existing = values.find((val) => val.name === v)
      initial[v] = existing?.daily_rating || 5
    })
    setLocalRatings(initial)
  }, [values, valuesList])

  // Debounced save - waits 800ms after last change
  const debouncedSave = useCallback((ratings: Record<string, number>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true)
      await onBatchUpdateValues(ratings)
      setSaving(false)
      setValuesDirty(false)
    }, 800)
  }, [onBatchUpdateValues])

  const handleValueChange = (name: string, rating: number) => {
    const newRatings = { ...localRatings, [name]: rating }
    setLocalRatings(newRatings)
    setValuesDirty(true)
    debouncedSave(newRatings)
  }

  const handleSaveReflection = async () => {
    if (!reflection.wentWell.trim() && !reflection.evenBetterIf.trim()) return
    setSaving(true)
    try {
      const content = `What went well: ${reflection.wentWell}\n\nEven better if: ${reflection.evenBetterIf}`
      await onCreateReflection({
        user_id: userId,
        type: 'evening',
        content,
        timestamp: new Date().toISOString(),
      })
      setReflection({ wentWell: '', evenBetterIf: '' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNote = async () => {
    if (!noteInput.trim()) return
    setSaving(true)
    try {
      await onCreateNote({
        user_id: userId,
        content: noteInput,
        timestamp: new Date().toISOString(),
      })
      setNoteInput('')
    } finally {
      setSaving(false)
    }
  }

  const getValueRating = (name: string) => {
    return localRatings[name] ?? values.find((v) => v.name === name)?.daily_rating ?? 5
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b">
        <button
          onClick={() => setActiveTab('reflection')}
          className={`pb-2 px-1 ${activeTab === 'reflection' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Reflection
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-2 px-1 ${activeTab === 'notes' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Notes
        </button>
        <button
          onClick={() => setActiveTab('values')}
          className={`pb-2 px-1 ${activeTab === 'values' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Values
        </button>
      </div>

      {/* Reflection Tab */}
      {activeTab === 'reflection' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">What went well today?</label>
            <textarea
              value={reflection.wentWell}
              onChange={(e) => setReflection({ ...reflection, wentWell: e.target.value })}
              className="w-full border rounded-lg p-2 h-20 resize-none"
              placeholder="Celebrate your wins..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Even better if...</label>
            <textarea
              value={reflection.evenBetterIf}
              onChange={(e) => setReflection({ ...reflection, evenBetterIf: e.target.value })}
              className="w-full border rounded-lg p-2 h-20 resize-none"
              placeholder="What could improve..."
            />
          </div>
          <button
            onClick={handleSaveReflection}
            disabled={saving || (!reflection.wentWell.trim() && !reflection.evenBetterIf.trim())}
            className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Reflection'}
          </button>

          {/* Theme Summary */}
          {themeSummary && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800 mb-1">Recurring Themes</h3>
              <p className="text-sm text-purple-700">{themeSummary}</p>
            </div>
          )}

          {/* Recent Reflections */}
          {reflections.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Recent Reflections</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {reflections.slice(0, 5).map((r) => (
                  <div key={r.id} className="p-2 bg-gray-50 rounded text-sm">
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(r.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 line-clamp-2">{r.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Quick thought or note..."
              className="flex-1 border rounded-lg p-2"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
            />
            <button
              onClick={handleSaveNote}
              disabled={saving || !noteInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notes.length === 0 && (
              <p className="text-gray-400 text-center py-4">No notes yet</p>
            )}
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-start justify-between p-2 border rounded"
              >
                <div className="flex-1">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(note.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="text-gray-400 hover:text-red-500 ml-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Values Tab */}
      {activeTab === 'values' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Rate how you lived each value today (1-10)</p>
            {valuesDirty && (
              <span className="text-xs text-amber-600">
                {saving ? 'Saving...' : 'Unsaved changes'}
              </span>
            )}
          </div>
          {valuesList.map((valueName) => {
            const existingValue = values.find((v) => v.name === valueName)
            const lastUpdated = existingValue?.timestamp
            const timeStr = lastUpdated
              ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
              : null
            return (
              <div key={valueName} className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="w-24 font-medium">{valueName}</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={getValueRating(valueName)}
                    onChange={(e) => handleValueChange(valueName, Number(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="w-8 text-center font-bold text-blue-600">
                    {getValueRating(valueName)}
                  </span>
                </div>
                {timeStr && (
                  <p className="text-xs text-gray-400 ml-24">Last updated: {timeStr}</p>
                )}
              </div>
            )
          })}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Average:{' '}
              <span className="font-bold">
                {(
                  valuesList.reduce((acc, v) => acc + getValueRating(v), 0) /
                  valuesList.length
                ).toFixed(1)}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
