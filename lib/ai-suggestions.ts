import type { Reflection, Value, Habit, Goal } from './types'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const AI_MODEL = 'xiaomi/mimo-v2-flash:free'

// Cache for suggestions to avoid redundant API calls
const suggestionCache = new Map<string, { timestamp: number; suggestions: AISuggestions }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export interface AISuggestions {
  habits: { name: string; frequency: string; reason: string }[]
  goals: { title: string; reason: string }[]
  insights: string[]
}

async function callAI(prompt: string, maxTokens = 512): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return ''

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: maxTokens,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) return ''
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch {
    return ''
  }
}

// Analyze values trend to find areas needing attention
function analyzeValuesTrend(values: Value[]): { declining: string[]; improving: string[]; stable: string[] } {
  const byName: Record<string, number[]> = {}

  for (const v of values) {
    if (!byName[v.name]) byName[v.name] = []
    byName[v.name].push(v.daily_rating)
  }

  const declining: string[] = []
  const improving: string[] = []
  const stable: string[] = []

  for (const [name, ratings] of Object.entries(byName)) {
    if (ratings.length < 2) {
      stable.push(name)
      continue
    }

    const recent = ratings.slice(-3)
    const older = ratings.slice(0, -3)

    if (older.length === 0) {
      stable.push(name)
      continue
    }

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length

    if (recentAvg < olderAvg - 1) {
      declining.push(name)
    } else if (recentAvg > olderAvg + 1) {
      improving.push(name)
    } else {
      stable.push(name)
    }
  }

  return { declining, improving, stable }
}

// Extract themes from reflections
function extractThemes(reflections: Reflection[]): string[] {
  const themes: string[] = []
  const text = reflections.map(r => r.content.toLowerCase()).join(' ')

  const patterns = [
    { keywords: ['stress', 'anxious', 'worried', 'overwhelm'], theme: 'stress management' },
    { keywords: ['sleep', 'tired', 'fatigue', 'rest'], theme: 'sleep quality' },
    { keywords: ['exercise', 'workout', 'gym', 'fitness'], theme: 'physical activity' },
    { keywords: ['family', 'friends', 'relationship', 'social'], theme: 'relationships' },
    { keywords: ['work', 'career', 'job', 'project'], theme: 'work-life balance' },
    { keywords: ['learn', 'study', 'read', 'skill'], theme: 'learning & growth' },
    { keywords: ['grateful', 'happy', 'joy', 'positive'], theme: 'gratitude & positivity' },
    { keywords: ['focus', 'distract', 'procrastin', 'attention'], theme: 'focus & productivity' },
  ]

  for (const p of patterns) {
    if (p.keywords.some(k => text.includes(k))) {
      themes.push(p.theme)
    }
  }

  return themes
}

// Generate suggestions based on patterns
export async function generateSuggestions(
  reflections: Reflection[],
  values: Value[],
  existingHabits: Habit[],
  existingGoals: Goal[]
): Promise<AISuggestions> {
  // Check cache
  const cacheKey = `${reflections.length}_${values.length}`
  const cached = suggestionCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.suggestions
  }

  // Analyze patterns locally first (saves tokens)
  const valuesTrend = analyzeValuesTrend(values)
  const themes = extractThemes(reflections)
  const existingHabitNames = existingHabits.map(h => h.name.toLowerCase())
  const existingGoalTitles = existingGoals.map(g => g.title.toLowerCase())

  // Build compact prompt only if we have enough data
  if (reflections.length < 3 && values.length < 5) {
    return { habits: [], goals: [], insights: [] }
  }

  const prompt = `Based on user data, suggest habits and goals. Return JSON only.
Declining values: ${valuesTrend.declining.join(', ') || 'none'}
Improving values: ${valuesTrend.improving.join(', ') || 'none'}
Themes found: ${themes.join(', ') || 'none'}
Existing habits: ${existingHabitNames.slice(0, 5).join(', ') || 'none'}
Existing goals: ${existingGoalTitles.slice(0, 5).join(', ') || 'none'}

Output: {"habits":[{name,frequency,reason}],"goals":[{title,reason}],"insights":["..."]}
Max 3 habits, 2 goals, 3 insights. Don't suggest existing ones.`

  const text = await callAI(prompt, 400)

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const suggestions: AISuggestions = {
        habits: (parsed.habits || []).slice(0, 3),
        goals: (parsed.goals || []).slice(0, 2),
        insights: (parsed.insights || []).slice(0, 3),
      }

      suggestionCache.set(cacheKey, { timestamp: Date.now(), suggestions })
      return suggestions
    }
  } catch {
    // Fall back to local suggestions
  }

  // Fallback: generate suggestions locally based on patterns
  const localSuggestions: AISuggestions = { habits: [], goals: [], insights: [] }

  if (valuesTrend.declining.includes('Health')) {
    localSuggestions.habits.push({
      name: 'Morning exercise',
      frequency: 'daily',
      reason: 'Health value has been declining'
    })
  }

  if (themes.includes('stress management')) {
    localSuggestions.habits.push({
      name: 'Meditation',
      frequency: 'daily',
      reason: 'Stress themes detected in reflections'
    })
  }

  if (themes.includes('sleep quality')) {
    localSuggestions.habits.push({
      name: 'Sleep by 10pm',
      frequency: 'daily',
      reason: 'Sleep issues mentioned in reflections'
    })
  }

  if (valuesTrend.declining.length > 0) {
    localSuggestions.insights.push(
      `Your ${valuesTrend.declining.join(', ')} value(s) have been declining recently`
    )
  }

  if (valuesTrend.improving.length > 0) {
    localSuggestions.insights.push(
      `Great progress on ${valuesTrend.improving.join(', ')}!`
    )
  }

  suggestionCache.set(cacheKey, { timestamp: Date.now(), suggestions: localSuggestions })
  return localSuggestions
}

// Quick check if suggestions are available (cached)
export function hasCachedSuggestions(reflectionCount: number, valueCount: number): boolean {
  const cacheKey = `${reflectionCount}_${valueCount}`
  const cached = suggestionCache.get(cacheKey)
  return cached !== undefined && Date.now() - cached.timestamp < CACHE_TTL
}

// Clear suggestion cache
export function clearSuggestionCache(): void {
  suggestionCache.clear()
}
