'use client'

import { useState } from 'react'
import type { Nutrition, Meal, MacroGoals, SavedFood } from '@/lib/types'

interface NutritionLoggerProps {
  entries: Nutrition[]
  meals: Meal[]
  savedFoods: SavedFood[]
  macroGoals: MacroGoals | null
  selectedDate: string
  onAdd: (nutrition: Omit<Nutrition, 'id' | 'created_at'>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onUpdate: (id: string, updates: Partial<Nutrition>) => Promise<void>
  onParse: (input: string) => Promise<Partial<Nutrition>[]>
  onCreateMeal: (meal: Omit<Meal, 'id' | 'created_at'>) => Promise<void>
  onDeleteMeal: (id: string) => Promise<void>
  onSaveFood: (food: Omit<SavedFood, 'id' | 'created_at'>) => Promise<void>
  onDeleteSavedFood: (id: string) => Promise<void>
  userId: string
}

export default function NutritionLogger({
  entries,
  meals,
  savedFoods,
  macroGoals,
  selectedDate,
  onAdd,
  onDelete,
  onUpdate,
  onParse,
  onCreateMeal,
  onDeleteMeal,
  onSaveFood,
  onDeleteSavedFood,
  userId,
}: NutritionLoggerProps) {
  const [activeTab, setActiveTab] = useState<'log' | 'meals' | 'saved'>('log')
  const [input, setInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<Partial<Nutrition>[]>([])

  // Expanded entry for viewing/editing
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<Nutrition | null>(null)

  // Meal creation state
  const [creatingMeal, setCreatingMeal] = useState(false)
  const [mealName, setMealName] = useState('')
  const [mealPortions, setMealPortions] = useState(4)
  const [mealIngredients, setMealIngredients] = useState<Partial<Nutrition>[]>([])
  const [parseError, setParseError] = useState<string | null>(null)

  // Loading states for async operations
  const [savingMeal, setSavingMeal] = useState(false)
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null)
  const [loggingMealId, setLoggingMealId] = useState<string | null>(null)
  const [addingItem, setAddingItem] = useState(false)
  const [savingFood, setSavingFood] = useState(false)

  // Check if a food name matches any saved food
  const findSavedFood = (name: string): SavedFood | undefined => {
    const normalizedName = name.toLowerCase().trim()
    return savedFoods.find(f => f.name.toLowerCase().trim() === normalizedName)
  }

  const handleParse = async () => {
    if (!input.trim()) return
    setParsing(true)
    setParseError(null)
    try {
      const result = await onParse(input)
      if (result && result.length > 0) {
        // Check each parsed item against saved foods for better accuracy
        const enhancedResult = result.map(item => {
          const saved = findSavedFood(item.food_name || '')
          if (saved) {
            return {
              ...item,
              macros: saved.macros,
              saved_food_id: saved.id,
              source: 'saved' as const,
            }
          }
          return { ...item, source: 'ai' as const }
        })
        setParsed(enhancedResult)
      } else {
        setParseError('No items parsed. Try rephrasing or check your API key.')
      }
    } catch (error) {
      console.error('Parse error:', error)
      setParseError(error instanceof Error ? error.message : 'Failed to parse. Check console for details.')
    } finally {
      setParsing(false)
    }
  }

  const handleAdd = async (item: Partial<Nutrition>) => {
    if (!item.food_name || addingItem) return
    setAddingItem(true)
    try {
      // Use selected date with current time
      const timestamp = new Date(selectedDate + 'T' + new Date().toTimeString().slice(0, 8)).toISOString()
      await onAdd({
        user_id: userId,
        food_name: item.food_name,
        macros: item.macros || {},
        saved_food_id: item.saved_food_id,
        source: item.source || 'ai',
        timestamp,
      })
      setParsed(parsed.filter((p) => p !== item))
      if (parsed.length === 1) {
        setInput('')
      }
    } finally {
      setAddingItem(false)
    }
  }

  const handleAddManual = async () => {
    if (!input.trim()) return
    const timestamp = new Date(selectedDate + 'T' + new Date().toTimeString().slice(0, 8)).toISOString()
    await onAdd({
      user_id: userId,
      food_name: input,
      macros: {},
      source: 'manual',
      timestamp,
    })
    setInput('')
  }

  // Save parsed item as a saved food for future use
  const handleSaveAsFood = async (item: Partial<Nutrition>) => {
    if (!item.food_name || savingFood) return
    setSavingFood(true)
    try {
      await onSaveFood({
        user_id: userId,
        name: item.food_name,
        macros: {
          calories: item.macros?.calories || 0,
          protein: item.macros?.protein || 0,
          carbs: item.macros?.carbs || 0,
          fat: item.macros?.fat || 0,
          fiber: item.macros?.fiber || 0,
        },
      })
    } finally {
      setSavingFood(false)
    }
  }

  // Log from saved food
  const handleLogSavedFood = async (food: SavedFood) => {
    const timestamp = new Date(selectedDate + 'T' + new Date().toTimeString().slice(0, 8)).toISOString()
    await onAdd({
      user_id: userId,
      food_name: food.name,
      macros: food.macros,
      saved_food_id: food.id,
      source: 'saved',
      timestamp,
    })
  }

  // Update entry
  const handleUpdateEntry = async () => {
    if (!editingEntry) return
    await onUpdate(editingEntry.id, {
      food_name: editingEntry.food_name,
      macros: editingEntry.macros,
    })
    setEditingEntry(null)
    setExpandedId(null)
  }

  // Save entry as a saved food
  const handleSaveEntryAsFood = async (entry: Nutrition) => {
    setSavingFood(true)
    try {
      await onSaveFood({
        user_id: userId,
        name: entry.food_name,
        macros: {
          calories: entry.macros?.calories || 0,
          protein: entry.macros?.protein || 0,
          carbs: entry.macros?.carbs || 0,
          fat: entry.macros?.fat || 0,
          fiber: entry.macros?.fiber || 0,
        },
      })
    } finally {
      setSavingFood(false)
    }
  }

  // Add ingredient to meal being created
  const handleAddToMeal = (item: Partial<Nutrition>) => {
    setMealIngredients([...mealIngredients, item])
    setParsed(parsed.filter((p) => p !== item))
    if (parsed.length === 1) {
      setInput('')
    }
  }

  // Calculate total macros for meal ingredients
  const calculateMealTotals = (ingredients: Partial<Nutrition>[]) => {
    return ingredients.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.macros?.calories || 0),
        protein: acc.protein + (item.macros?.protein || 0),
        carbs: acc.carbs + (item.macros?.carbs || 0),
        fat: acc.fat + (item.macros?.fat || 0),
        fiber: acc.fiber + (item.macros?.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    )
  }

  // Save the meal
  const handleSaveMeal = async () => {
    if (!mealName.trim() || mealIngredients.length === 0 || savingMeal) return

    setSavingMeal(true)
    try {
      const totalMacros = calculateMealTotals(mealIngredients)

      await onCreateMeal({
        user_id: userId,
        name: mealName,
        ingredients: mealIngredients.map(i => ({
          name: i.food_name || '',
          macros: i.macros || {}
        })),
        portions: mealPortions,
        total_macros: totalMacros,
      })

      // Reset meal creation
      setMealName('')
      setMealPortions(4)
      setMealIngredients([])
      setCreatingMeal(false)
    } finally {
      setSavingMeal(false)
    }
  }

  // Log a portion from a saved meal
  const handleLogPortion = async (meal: Meal) => {
    if (loggingMealId) return // Prevent double-click
    setLoggingMealId(meal.id)
    try {
      const portionMacros = {
      calories: Math.round(meal.total_macros.calories / meal.portions),
      protein: Math.round(meal.total_macros.protein / meal.portions),
      carbs: Math.round(meal.total_macros.carbs / meal.portions),
      fat: Math.round(meal.total_macros.fat / meal.portions),
      fiber: Math.round(meal.total_macros.fiber / meal.portions),
    }

      const timestamp = new Date(selectedDate + 'T' + new Date().toTimeString().slice(0, 8)).toISOString()
      await onAdd({
        user_id: userId,
        food_name: `${meal.name} (1/${meal.portions} portion)`,
        macros: portionMacros,
        meal_id: meal.id,
        source: 'saved',
        timestamp,
      })
    } finally {
      setLoggingMealId(null)
    }
  }

  // Delete a meal with loading state
  const handleDeleteMeal = async (id: string) => {
    if (deletingMealId) return
    setDeletingMealId(id)
    try {
      await onDeleteMeal(id)
    } finally {
      setDeletingMealId(null)
    }
  }

  const totalMacros = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.macros?.calories || 0),
      protein: acc.protein + (entry.macros?.protein || 0),
      carbs: acc.carbs + (entry.macros?.carbs || 0),
      fat: acc.fat + (entry.macros?.fat || 0),
      fiber: acc.fiber + (entry.macros?.fiber || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  )

  // Calculate remaining macros
  const remaining = macroGoals ? {
    calories: macroGoals.calories - totalMacros.calories,
    protein: macroGoals.protein - totalMacros.protein,
    carbs: macroGoals.carbs - totalMacros.carbs,
    fat: macroGoals.fat - totalMacros.fat,
    fiber: macroGoals.fiber - totalMacros.fiber,
  } : null

  // Calculate percentage for progress bars
  const getPercent = (current: number, goal: number) => Math.min(100, Math.round((current / goal) * 100))
  const isOverGoal = (current: number, goal: number) => current > goal

  // Get source badge
  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'ai':
        return <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded" title="AI estimated - click to verify/edit">AI</span>
      case 'saved':
        return <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded" title="From saved foods">Saved</span>
      case 'manual':
        return <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded" title="Manually entered">Manual</span>
      default:
        return <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded" title="AI estimated - click to verify/edit">AI</span>
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Nutrition</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('log')}
            className={`px-3 py-1 text-sm rounded ${activeTab === 'log' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
          >
            Log
          </button>
          <button
            onClick={() => setActiveTab('meals')}
            className={`px-3 py-1 text-sm rounded ${activeTab === 'meals' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
          >
            Meals
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1 text-sm rounded ${activeTab === 'saved' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
          >
            Saved ({savedFoods.length})
          </button>
        </div>
      </div>

      {/* Daily Summary with Goals */}
      {macroGoals ? (
        <div className="mb-4 p-3 bg-green-50 rounded-lg space-y-2">
          {/* Calories - main bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Calories</span>
              <span className={remaining && remaining.calories < 0 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                {totalMacros.calories} / {macroGoals.calories}
                {remaining && (
                  <span className="ml-2 text-xs">
                    ({remaining.calories >= 0 ? `${remaining.calories} left` : `${Math.abs(remaining.calories)} over`})
                  </span>
                )}
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${isOverGoal(totalMacros.calories, macroGoals.calories) ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${getPercent(totalMacros.calories, macroGoals.calories)}%` }}
              />
            </div>
          </div>

          {/* Macros row */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Protein</span>
                <span className={remaining && remaining.protein < 0 ? 'text-red-600' : ''}>
                  {totalMacros.protein}g
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isOverGoal(totalMacros.protein, macroGoals.protein) ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${getPercent(totalMacros.protein, macroGoals.protein)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 text-right">{macroGoals.protein}g</div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Carbs</span>
                <span className={remaining && remaining.carbs < 0 ? 'text-red-600' : ''}>
                  {totalMacros.carbs}g
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isOverGoal(totalMacros.carbs, macroGoals.carbs) ? 'bg-red-500' : 'bg-yellow-500'}`}
                  style={{ width: `${getPercent(totalMacros.carbs, macroGoals.carbs)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 text-right">{macroGoals.carbs}g</div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Fat</span>
                <span className={remaining && remaining.fat < 0 ? 'text-red-600' : ''}>
                  {totalMacros.fat}g
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isOverGoal(totalMacros.fat, macroGoals.fat) ? 'bg-red-500' : 'bg-orange-500'}`}
                  style={{ width: `${getPercent(totalMacros.fat, macroGoals.fat)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 text-right">{macroGoals.fat}g</div>
            </div>

            {/* Fiber */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Fiber</span>
                <span>{totalMacros.fiber}g</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${getPercent(totalMacros.fiber, macroGoals.fiber)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 text-right">{macroGoals.fiber}g</div>
            </div>
          </div>
        </div>
      ) : (
        /* Simple summary when no goals set */
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
      )}

      {activeTab === 'log' && (
        <>
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

          {/* Parse Error */}
          {parseError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <strong>Parse Error:</strong> {parseError}
            </div>
          )}

          {/* Parsed Items */}
          {parsed.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Parsed Foods:</p>
              <div className="space-y-2">
                {parsed.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white p-2 rounded">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium">{item.food_name}</span>
                        {getSourceBadge(item.source)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.macros?.calories ?? 0} cal | {item.macros?.protein ?? 0}g P | {item.macros?.carbs ?? 0}g C | {item.macros?.fat ?? 0}g F
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAdd(item)}
                        disabled={addingItem}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
                      >
                        Log
                      </button>
                      {item.source === 'ai' && !findSavedFood(item.food_name || '') && (
                        <button
                          onClick={() => handleSaveAsFood(item)}
                          disabled={savingFood}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
                          title="Save for future use"
                        >
                          Save
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setCreatingMeal(true)
                          setActiveTab('meals')
                          handleAddToMeal(item)
                        }}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200"
                        title="Add to new meal"
                      >
                        +Meal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Log from Saved Foods */}
          {savedFoods.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Quick Log from Saved:</p>
              <div className="flex flex-wrap gap-2">
                {savedFoods.slice(0, 6).map((food) => (
                  <button
                    key={food.id}
                    onClick={() => handleLogSavedFood(food)}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition"
                  >
                    {food.name}
                    <span className="text-xs ml-1 opacity-70">({food.macros.calories} cal)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Log from Saved Meals */}
          {meals.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Quick Log from Meals:</p>
              <div className="flex flex-wrap gap-2">
                {meals.slice(0, 4).map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => handleLogPortion(meal)}
                    disabled={loggingMealId !== null}
                    className={`px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition disabled:opacity-50 ${loggingMealId === meal.id ? 'animate-pulse' : ''}`}
                  >
                    {loggingMealId === meal.id ? 'Logging...' : (
                      <>
                        {meal.name}
                        <span className="text-xs ml-1 opacity-70">
                          ({Math.round(meal.total_macros.calories / meal.portions)} cal)
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Entries - Now expandable */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {entries.length === 0 && (
              <p className="text-gray-400 text-center py-4">No entries today</p>
            )}
            {entries.map((entry) => (
              <div key={entry.id} className="border rounded overflow-hidden">
                {/* Entry header - clickable */}
                <div
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="font-medium">{entry.food_name}</p>
                      {getSourceBadge(entry.source)}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-3">
                      <span>{entry.macros?.calories ?? 0} cal</span>
                      <span>{entry.macros?.protein ?? 0}g P</span>
                      <span>{entry.macros?.carbs ?? 0}g C</span>
                      <span>{entry.macros?.fat ?? 0}g F</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">{expandedId === entry.id ? '▲' : '▼'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(entry.id)
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Expanded content - edit form */}
                {expandedId === entry.id && (
                  <div className="p-3 bg-gray-50 border-t space-y-3">
                    {editingEntry?.id === entry.id ? (
                      <>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Food Name</label>
                          <input
                            type="text"
                            value={editingEntry.food_name}
                            onChange={(e) => setEditingEntry({ ...editingEntry, food_name: e.target.value })}
                            className="w-full border rounded p-2 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Calories</label>
                            <input
                              type="number"
                              value={editingEntry.macros?.calories ?? 0}
                              onChange={(e) => setEditingEntry({
                                ...editingEntry,
                                macros: { ...editingEntry.macros, calories: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full border rounded p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Protein</label>
                            <input
                              type="number"
                              value={editingEntry.macros?.protein ?? 0}
                              onChange={(e) => setEditingEntry({
                                ...editingEntry,
                                macros: { ...editingEntry.macros, protein: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full border rounded p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Carbs</label>
                            <input
                              type="number"
                              value={editingEntry.macros?.carbs ?? 0}
                              onChange={(e) => setEditingEntry({
                                ...editingEntry,
                                macros: { ...editingEntry.macros, carbs: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full border rounded p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Fat</label>
                            <input
                              type="number"
                              value={editingEntry.macros?.fat ?? 0}
                              onChange={(e) => setEditingEntry({
                                ...editingEntry,
                                macros: { ...editingEntry.macros, fat: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full border rounded p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Fiber</label>
                            <input
                              type="number"
                              value={editingEntry.macros?.fiber ?? 0}
                              onChange={(e) => setEditingEntry({
                                ...editingEntry,
                                macros: { ...editingEntry.macros, fiber: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full border rounded p-2 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingEntry(null)}
                            className="flex-1 px-3 py-1.5 border rounded text-sm hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateEntry}
                            className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            Save Changes
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-5 gap-2 text-sm">
                          <div className="text-center p-2 bg-white rounded">
                            <div className="font-bold text-green-600">{entry.macros?.calories ?? 0}</div>
                            <div className="text-xs text-gray-500">Calories</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="font-bold text-blue-600">{entry.macros?.protein ?? 0}g</div>
                            <div className="text-xs text-gray-500">Protein</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="font-bold text-yellow-600">{entry.macros?.carbs ?? 0}g</div>
                            <div className="text-xs text-gray-500">Carbs</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="font-bold text-orange-600">{entry.macros?.fat ?? 0}g</div>
                            <div className="text-xs text-gray-500">Fat</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="font-bold text-emerald-600">{entry.macros?.fiber ?? 0}g</div>
                            <div className="text-xs text-gray-500">Fiber</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingEntry({ ...entry })}
                            className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          {!findSavedFood(entry.food_name) && (
                            <button
                              onClick={() => handleSaveEntryAsFood(entry)}
                              disabled={savingFood}
                              className="flex-1 px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 disabled:opacity-50"
                            >
                              {savingFood ? 'Saving...' : 'Save for Future'}
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          Logged at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'meals' && (
        <div className="space-y-4">
          {/* Create New Meal Section */}
          {creatingMeal ? (
            <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
              <h3 className="font-medium mb-3">Create New Meal</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Meal Name</label>
                  <input
                    type="text"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="e.g., Chicken Stir Fry"
                    className="w-full border rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Number of Portions</label>
                  <input
                    type="number"
                    value={mealPortions}
                    onChange={(e) => setMealPortions(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="w-24 border rounded-lg p-2"
                  />
                </div>

                {/* Parse ingredients */}
                <div>
                  <label className="block text-sm mb-1">Add Ingredients</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="500g chicken breast, 2 cups rice..."
                      className="flex-1 border rounded-lg p-2"
                    />
                    <button
                      onClick={handleParse}
                      disabled={parsing || !input.trim()}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      {parsing ? '...' : 'Parse'}
                    </button>
                  </div>
                </div>

                {/* Parsed items to add to meal */}
                {parsed.length > 0 && (
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Click to add to meal:</p>
                    {parsed.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handleAddToMeal(item)}
                        className="mr-2 mb-2 px-3 py-1 bg-gray-100 hover:bg-green-100 rounded text-sm"
                      >
                        + {item.food_name} ({item.macros?.calories || '?'} cal)
                      </button>
                    ))}
                  </div>
                )}

                {/* Current ingredients */}
                {mealIngredients.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Ingredients ({mealIngredients.length}):
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {mealIngredients.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                          <span>{item.food_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">{item.macros?.calories || 0} cal</span>
                            <button
                              onClick={() => setMealIngredients(mealIngredients.filter((_, idx) => idx !== i))}
                              className="text-red-400 hover:text-red-600"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Total:</span>
                        <span>{calculateMealTotals(mealIngredients).calories} cal</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Per portion ({mealPortions}):</span>
                        <span>{Math.round(calculateMealTotals(mealIngredients).calories / mealPortions)} cal</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCreatingMeal(false)
                      setMealName('')
                      setMealPortions(4)
                      setMealIngredients([])
                      setParsed([])
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMeal}
                    disabled={!mealName.trim() || mealIngredients.length === 0 || savingMeal}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {savingMeal ? 'Saving...' : 'Save Meal'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreatingMeal(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition"
            >
              + Create New Meal
            </button>
          )}

          {/* Saved Meals List */}
          <div>
            <h3 className="font-medium mb-2">Saved Meals</h3>
            {meals.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No saved meals yet</p>
            ) : (
              <div className="space-y-2">
                {meals.map((meal) => (
                  <div key={meal.id} className={`p-3 border rounded-lg ${loggingMealId === meal.id || deletingMealId === meal.id ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{meal.name}</h4>
                        <p className="text-sm text-gray-500">
                          {meal.portions} portions | {Math.round(meal.total_macros.calories / meal.portions)} cal/portion
                        </p>
                        <div className="text-xs text-gray-400 mt-1">
                          Total: {meal.total_macros.calories} cal, {meal.total_macros.protein}g protein
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLogPortion(meal)}
                          disabled={loggingMealId !== null || deletingMealId !== null}
                          className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                        >
                          {loggingMealId === meal.id ? 'Logging...' : 'Log Portion'}
                        </button>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          disabled={loggingMealId !== null || deletingMealId !== null}
                          className="px-2 py-1.5 text-gray-400 hover:text-red-500 disabled:opacity-50"
                        >
                          {deletingMealId === meal.id ? '...' : '×'}
                        </button>
                      </div>
                    </div>

                    {/* Expandable ingredients */}
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        View ingredients ({meal.ingredients.length})
                      </summary>
                      <div className="mt-2 pl-2 border-l-2 border-gray-200 text-sm text-gray-600">
                        {meal.ingredients.map((ing, i) => (
                          <div key={i}>{ing.name}</div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Saved foods have accurate macros for quick logging. Save foods after verifying their nutrition info.
          </p>

          {savedFoods.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No saved foods yet. Parse and save foods from the Log tab to build your personal database.
            </p>
          ) : (
            <div className="space-y-2">
              {savedFoods.map((food) => (
                <div key={food.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{food.name}</h4>
                    <div className="text-xs text-gray-500 flex gap-3">
                      <span>{food.macros.calories} cal</span>
                      <span>{food.macros.protein}g P</span>
                      <span>{food.macros.carbs}g C</span>
                      <span>{food.macros.fat}g F</span>
                      <span>{food.macros.fiber}g fiber</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLogSavedFood(food)}
                      className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      Log
                    </button>
                    <button
                      onClick={() => onDeleteSavedFood(food.id)}
                      className="px-2 py-1.5 text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
