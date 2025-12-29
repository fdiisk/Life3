'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Journal } from '@/lib/types'

interface JournalWriterProps {
  journal: Journal | null
  pastJournals: Journal[]
  userId: string
  selectedDate: string
  onSave: (journal: Omit<Journal, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

const MOOD_OPTIONS: { value: Journal['mood']; emoji: string; label: string }[] = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'bad', emoji: '😔', label: 'Bad' },
  { value: 'terrible', emoji: '😢', label: 'Terrible' },
]

export default function JournalWriter({
  journal,
  pastJournals,
  userId,
  selectedDate,
  onSave,
}: JournalWriterProps) {
  const [content, setContent] = useState(journal?.content || '')
  const [mood, setMood] = useState<Journal['mood']>(journal?.mood)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [viewingEntry, setViewingEntry] = useState<Journal | null>(null)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const contentRef = useRef(content)
  contentRef.current = content

  // Update content when journal or date changes
  useEffect(() => {
    setContent(journal?.content || '')
    setMood(journal?.mood)
    setLastSaved(journal?.updated_at ? new Date(journal.updated_at) : null)
  }, [journal, selectedDate])

  // Auto-save after 2 seconds of inactivity
  const debouncedSave = useCallback(async () => {
    if (!contentRef.current.trim() && !mood) return

    setSaving(true)
    try {
      await onSave({
        user_id: userId,
        date: selectedDate,
        content: contentRef.current,
        mood,
      })
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save journal:', error)
    } finally {
      setSaving(false)
    }
  }, [userId, selectedDate, mood, onSave])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      debouncedSave()
    }, 2000)
  }

  const handleMoodChange = async (newMood: Journal['mood']) => {
    setMood(newMood)

    // Save immediately when mood changes
    setSaving(true)
    try {
      await onSave({
        user_id: userId,
        date: selectedDate,
        content,
        mood: newMood,
      })
      setLastSaved(new Date())
    } finally {
      setSaving(false)
    }
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const isToday = selectedDate === new Date().toISOString().split('T')[0]
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Journal</h2>
          {!isToday && (
            <span className="text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-xs text-gray-400">Saving...</span>
          )}
          {!saving && lastSaved && (
            <span className="text-xs text-gray-400">
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1 text-sm rounded ${showHistory ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            History
          </button>
        </div>
      </div>

      {/* Mood Selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-500">How are you feeling?</span>
        <div className="flex gap-1">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleMoodChange(option.value)}
              className={`px-2 py-1 rounded text-lg transition ${
                mood === option.value
                  ? 'bg-blue-100 ring-2 ring-blue-400'
                  : 'hover:bg-gray-100'
              }`}
              title={option.label}
            >
              {option.emoji}
            </button>
          ))}
        </div>
      </div>

      {showHistory ? (
        /* History View */
        <div className="space-y-3">
          {viewingEntry ? (
            <div>
              <button
                onClick={() => setViewingEntry(null)}
                className="text-sm text-blue-500 hover:underline mb-2"
              >
                ← Back to list
              </button>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {new Date(viewingEntry.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  {viewingEntry.mood && (
                    <span className="text-lg">
                      {MOOD_OPTIONS.find(m => m.value === viewingEntry.mood)?.emoji}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{viewingEntry.content}</p>
              </div>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {pastJournals.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No past entries yet</p>
              ) : (
                pastJournals.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setViewingEntry(entry)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        {entry.mood && (
                          <span>{MOOD_OPTIONS.find(m => m.value === entry.mood)?.emoji}</span>
                        )}
                        <span className="text-xs text-gray-400">
                          {entry.content.trim().split(/\s+/).length} words
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {entry.content.slice(0, 100)}
                      {entry.content.length > 100 ? '...' : ''}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        /* Writing View */
        <div>
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={isToday
              ? "What's on your mind today? Write freely..."
              : "Add to this day's journal..."
            }
            className="w-full h-64 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>{wordCount} words</span>
            <span>Auto-saves as you type</span>
          </div>
        </div>
      )}
    </div>
  )
}
