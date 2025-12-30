'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import * as actions from '@/actions'
import type { Goal, Habit, Weight, MacroGoals } from '@/lib/types'
import { CORE_VALUES } from '@/lib/constants'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const DEFAULT_MACRO_GOALS: MacroGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  fiber: 30,
}

interface SettingsPageProps {
  userId: string
}

export default function SettingsPage({ userId }: SettingsPageProps) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'values' | 'goals' | 'habits' | 'weight' | 'nutrition' | 'security'>('values')

  // Values state
  const [customValues, setCustomValues] = useState<string[]>([...CORE_VALUES])
  const [newValue, setNewValue] = useState('')

  // Macro goals state
  const [macroGoals, setMacroGoals] = useState<MacroGoals | null>(null)

  // Security state
  const [hasJournalPin, setHasJournalPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinSuccess, setPinSuccess] = useState<string | null>(null)

  // Goals state
  const [goals, setGoals] = useState<Goal[]>([])
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [editGoalTitle, setEditGoalTitle] = useState('')
  const [editGoalWeight, setEditGoalWeight] = useState(50)

  // Habits state
  const [habits, setHabits] = useState<Habit[]>([])
  const [editingHabit, setEditingHabit] = useState<string | null>(null)
  const [editHabitName, setEditHabitName] = useState('')
  const [editHabitFreq, setEditHabitFreq] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Weight state
  const [weights, setWeights] = useState<Weight[]>([])
  const [targetWeight, setTargetWeight] = useState<number | null>(null)
  const [newWeight, setNewWeight] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [goalsData, habitsData, weightsData, settingsData, hasPinData] = await Promise.all([
        actions.getGoals(userId),
        actions.getHabits(userId),
        actions.getWeightEntries(userId, 30),
        actions.getUserSettings(userId),
        actions.hasJournalPin(userId),
      ])
      setGoals(goalsData)
      setHabits(habitsData)
      setWeights(weightsData)
      setHasJournalPin(hasPinData)
      if (settingsData) {
        if (settingsData.core_values?.length > 0) {
          setCustomValues(settingsData.core_values)
        }
        setTargetWeight(settingsData.target_weight_kg)
        if (settingsData.macro_goals) {
          setMacroGoals(settingsData.macro_goals)
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddValue = () => {
    if (newValue.trim() && !customValues.includes(newValue.trim())) {
      const updated = [...customValues, newValue.trim()]
      setCustomValues(updated)
      setNewValue('')
      saveValues(updated)
    }
  }

  const handleRemoveValue = (value: string) => {
    const updated = customValues.filter(v => v !== value)
    setCustomValues(updated)
    saveValues(updated)
  }

  const saveValues = async (values: string[]) => {
    setSaving(true)
    try {
      await actions.updateUserSettings(userId, { core_values: values })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateGoal = async (id: string) => {
    await actions.updateGoal(id, { title: editGoalTitle, weight: editGoalWeight })
    setEditingGoal(null)
    loadData()
  }

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Delete this goal?')) {
      await actions.deleteGoal(id)
      loadData()
    }
  }

  const handleUpdateHabit = async (id: string) => {
    await actions.updateHabit(id, { name: editHabitName, frequency: editHabitFreq })
    setEditingHabit(null)
    loadData()
  }

  const handleDeleteHabit = async (id: string) => {
    if (confirm('Delete this habit?')) {
      await actions.deleteHabit(id)
      loadData()
    }
  }

  const handleLogWeight = async () => {
    const weight = parseFloat(newWeight)
    if (isNaN(weight) || weight <= 0) return

    setSaving(true)
    try {
      await actions.createWeightEntry({
        user_id: userId,
        weight_kg: weight,
        timestamp: new Date().toISOString(),
      })
      setNewWeight('')
      loadData()
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTargetWeight = async () => {
    setSaving(true)
    try {
      await actions.updateUserSettings(userId, { target_weight_kg: targetWeight })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMacroGoals = async () => {
    setSaving(true)
    try {
      await actions.updateUserSettings(userId, { macro_goals: macroGoals })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateMacroGoal = (key: keyof MacroGoals, value: number) => {
    if (!macroGoals) {
      setMacroGoals({ ...DEFAULT_MACRO_GOALS, [key]: value })
    } else {
      setMacroGoals({ ...macroGoals, [key]: value })
    }
  }

  const handleSetJournalPin = async () => {
    setPinError(null)
    setPinSuccess(null)

    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      setPinError('PIN must be exactly 6 digits')
      return
    }

    if (newPin !== confirmPin) {
      setPinError('PINs do not match')
      return
    }

    setSaving(true)
    try {
      const result = await actions.setJournalPin(userId, newPin)
      if (result.success) {
        setHasJournalPin(true)
        setNewPin('')
        setConfirmPin('')
        setPinSuccess('Journal PIN set successfully!')
        // Clear success message after 3 seconds
        setTimeout(() => setPinSuccess(null), 3000)
      } else {
        setPinError(result.error || 'Failed to set PIN')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveJournalPin = async () => {
    setSaving(true)
    try {
      await actions.updateUserSettings(userId, { journal_pin_hash: null })
      setHasJournalPin(false)
      setPinSuccess('Journal PIN removed')
      setTimeout(() => setPinSuccess(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWeight = async (id: string) => {
    await actions.deleteWeightEntry(id)
    loadData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-500">Loading settings...</div>
      </div>
    )
  }

  const weightChartData = [...weights]
    .reverse()
    .map(w => ({
      date: new Date(w.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: w.weight_kg,
    }))

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-500">Manage your values, goals, habits, and weight</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Back to Dashboard
          </Link>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-300 overflow-x-auto">
          {(['values', 'goals', 'habits', 'nutrition', 'weight', 'security'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize transition whitespace-nowrap ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Values Tab */}
        {activeTab === 'values' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Core Values</h2>
            <p className="text-gray-500 mb-4">
              These values appear in your morning and evening check-ins.
            </p>

            <div className="space-y-2 mb-4">
              {customValues.map(value => (
                <div key={value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{value}</span>
                  <button
                    onClick={() => handleRemoveValue(value)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Add a new value..."
                className="flex-1 border rounded-lg px-3 py-2"
                onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
              />
              <button
                onClick={handleAddValue}
                disabled={saving || !newValue.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Goals</h2>
            <p className="text-gray-500 mb-4">
              Edit or remove your goals. Weight determines priority (1-100).
            </p>

            <div className="space-y-3">
              {goals.length === 0 && (
                <p className="text-gray-400 text-center py-4">No goals yet</p>
              )}
              {goals.map(goal => (
                <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                  {editingGoal === goal.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editGoalTitle}
                        onChange={(e) => setEditGoalTitle(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600">Weight:</label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={editGoalWeight}
                          onChange={(e) => setEditGoalWeight(Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="font-bold text-blue-600 w-8">{editGoalWeight}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateGoal(goal.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingGoal(null)}
                          className="px-3 py-1 bg-gray-300 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{goal.title}</h3>
                        <p className="text-sm text-gray-500">Weight: {goal.weight}%</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingGoal(goal.id)
                            setEditGoalTitle(goal.title)
                            setEditGoalWeight(goal.weight)
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habits Tab */}
        {activeTab === 'habits' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Habits</h2>
            <p className="text-gray-500 mb-4">
              Manage your habits and their frequency.
            </p>

            <div className="space-y-3">
              {habits.length === 0 && (
                <p className="text-gray-400 text-center py-4">No habits yet</p>
              )}
              {habits.map(habit => (
                <div key={habit.id} className="p-4 bg-gray-50 rounded-lg">
                  {editingHabit === habit.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editHabitName}
                        onChange={(e) => setEditHabitName(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                      <select
                        value={editHabitFreq}
                        onChange={(e) => setEditHabitFreq(e.target.value as typeof editHabitFreq)}
                        className="border rounded px-3 py-2"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateHabit(habit.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingHabit(null)}
                          className="px-3 py-1 bg-gray-300 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{habit.name}</h3>
                        <p className="text-sm text-gray-500">
                          {habit.frequency} | Streak: {habit.streak} days
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingHabit(habit.id)
                            setEditHabitName(habit.name)
                            setEditHabitFreq(habit.frequency)
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nutrition Tab */}
        {activeTab === 'nutrition' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Daily Macro Goals</h2>
            <p className="text-gray-500 mb-6">
              Set your daily macro targets. These will be displayed in the Nutrition Logger to track your progress.
            </p>

            {!macroGoals ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No macro goals set yet</p>
                <button
                  onClick={() => setMacroGoals(DEFAULT_MACRO_GOALS)}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Set Up Macro Goals
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Calories */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Daily Calories</label>
                    <span className="text-lg font-bold text-green-600">{macroGoals.calories} kcal</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="5000"
                    step="50"
                    value={macroGoals.calories}
                    onChange={(e) => handleUpdateMacroGoal('calories', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>1000</span>
                    <span>3000</span>
                    <span>5000</span>
                  </div>
                </div>

                {/* Protein */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Protein</label>
                    <span className="text-lg font-bold text-blue-600">{macroGoals.protein}g</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="5"
                    value={macroGoals.protein}
                    onChange={(e) => handleUpdateMacroGoal('protein', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>50g</span>
                    <span>175g</span>
                    <span>300g</span>
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Carbohydrates</label>
                    <span className="text-lg font-bold text-yellow-600">{macroGoals.carbs}g</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="400"
                    step="5"
                    value={macroGoals.carbs}
                    onChange={(e) => handleUpdateMacroGoal('carbs', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>20g (keto)</span>
                    <span>200g</span>
                    <span>400g</span>
                  </div>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Fat</label>
                    <span className="text-lg font-bold text-orange-600">{macroGoals.fat}g</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="5"
                    value={macroGoals.fat}
                    onChange={(e) => handleUpdateMacroGoal('fat', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>20g</span>
                    <span>100g</span>
                    <span>200g</span>
                  </div>
                </div>

                {/* Fiber */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Fiber</label>
                    <span className="text-lg font-bold text-emerald-600">{macroGoals.fiber}g</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="1"
                    value={macroGoals.fiber}
                    onChange={(e) => handleUpdateMacroGoal('fiber', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>10g</span>
                    <span>35g</span>
                    <span>60g</span>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-3">Daily Targets Summary</h3>
                  <div className="grid grid-cols-5 gap-2 text-center text-sm">
                    <div className="p-2 bg-green-100 rounded">
                      <div className="font-bold text-green-700">{macroGoals.calories}</div>
                      <div className="text-xs text-gray-500">cal</div>
                    </div>
                    <div className="p-2 bg-blue-100 rounded">
                      <div className="font-bold text-blue-700">{macroGoals.protein}g</div>
                      <div className="text-xs text-gray-500">protein</div>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded">
                      <div className="font-bold text-yellow-700">{macroGoals.carbs}g</div>
                      <div className="text-xs text-gray-500">carbs</div>
                    </div>
                    <div className="p-2 bg-orange-100 rounded">
                      <div className="font-bold text-orange-700">{macroGoals.fat}g</div>
                      <div className="text-xs text-gray-500">fat</div>
                    </div>
                    <div className="p-2 bg-emerald-100 rounded">
                      <div className="font-bold text-emerald-700">{macroGoals.fiber}g</div>
                      <div className="text-xs text-gray-500">fiber</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveMacroGoals}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Goals'}
                  </button>
                  <button
                    onClick={() => setMacroGoals(null)}
                    className="px-4 py-2 text-red-500 hover:text-red-700"
                  >
                    Clear Goals
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weight Tab */}
        {activeTab === 'weight' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Log Weight</h2>

              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Current Weight (kg)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="e.g. 75.5"
                      className="flex-1 border rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={handleLogWeight}
                      disabled={saving || !newWeight}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      Log
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Target Weight (kg)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={targetWeight ?? ''}
                      onChange={(e) => setTargetWeight(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="e.g. 70.0"
                      className="flex-1 border rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={handleSaveTargetWeight}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Weight Chart */}
              {weightChartData.length > 1 && (
                <div className="h-64 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData}>
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} fontSize={12} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                      />
                      {targetWeight && (
                        <Line
                          type="monotone"
                          dataKey={() => targetWeight}
                          stroke="#22c55e"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Target"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Weight History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Weight History</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {weights.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No weight entries yet</p>
                )}
                {weights.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-bold text-lg">{entry.weight_kg} kg</span>
                      <span className="text-gray-500 ml-3">
                        {new Date(entry.timestamp).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteWeight(entry.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Security Settings</h2>

            {/* Journal PIN */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-2">Journal PIN Protection</h3>
              <p className="text-gray-500 text-sm mb-4">
                Protect your journal with a 6-digit PIN. You&apos;ll need to enter it once per session to access your journal entries.
              </p>

              {hasJournalPin ? (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔒</span>
                      <div>
                        <p className="font-medium text-green-800">Journal PIN is active</p>
                        <p className="text-sm text-green-600">Your journal is protected</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveJournalPin}
                      disabled={saving}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                    >
                      Remove PIN
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New PIN (6 digits)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit PIN"
                      className="w-48 border rounded-lg px-4 py-2 text-center tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Confirm PIN"
                      className="w-48 border rounded-lg px-4 py-2 text-center tracking-widest"
                    />
                  </div>
                  <button
                    onClick={handleSetJournalPin}
                    disabled={saving || newPin.length !== 6 || confirmPin.length !== 6}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? 'Setting PIN...' : 'Set Journal PIN'}
                  </button>
                </div>
              )}

              {pinError && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg">
                  {pinError}
                </div>
              )}
              {pinSuccess && (
                <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-lg">
                  {pinSuccess}
                </div>
              )}
            </div>

            {/* Session Info */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-medium mb-2">Session</h3>
              <p className="text-sm text-gray-500 mb-4">
                You are currently logged in. Use the logout button on the dashboard to end your session.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
