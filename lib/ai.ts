import { ParsedInput, ParsedGoalsResult } from './types'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const AI_MODEL = 'xiaomi/mimo-v2-flash:free'

// Pattern cache for learning common inputs (in-memory, respects append-only)
const patternCache = new Map<string, ParsedInput>()

function normalizeInput(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, ' ')
}

function getCacheKey(input: string): string {
  // Create a fuzzy cache key for similar inputs
  const normalized = normalizeInput(input)
  // Extract key patterns (numbers, common words)
  const words = normalized.split(' ').filter(w => w.length > 2).slice(0, 5)
  return words.join('_')
}

async function callAI(systemPrompt: string, userMessage: string, maxTokens = 512): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  // Add timeout using AbortController
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

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
        temperature: 0.1, // Low temperature for consistent parsing
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AI API error: ${response.statusText} - ${error}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI request timed out after 30 seconds')
    }
    throw error
  }
}

// Compact system prompt optimized for token efficiency
const PARSE_SYSTEM_PROMPT = `Parse life data to JSON. Output ONLY valid JSON:
{
  "tasks":[{title,due_date,goal_id}],
  "habits":[{name,frequency}],
  "nutrition":[{food_name,macros:{calories,protein,carbs,fat,fiber}}],
  "fitness":[{exercise_name,sets,reps,weight,cardio_minutes}],
  "notes":[{content}],
  "goals":[{title,weight}]
}
Rules: Extract all items. Estimate nutrition macros. Parse "3x10 135lbs" format. frequency=daily|weekly|monthly. Return JSON only.`

export async function parseUserInput(input: string): Promise<ParsedInput> {
  // Check pattern cache first
  const cacheKey = getCacheKey(input)
  const cached = patternCache.get(cacheKey)
  if (cached) {
    // Return cached pattern with updated specifics
    return cached
  }

  const text = await callAI(PARSE_SYSTEM_PROMPT, input)

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text)

    // Ensure all arrays exist
    const parsed: ParsedInput = {
      tasks: result.tasks || [],
      habits: result.habits || [],
      nutrition: result.nutrition || [],
      fitness: result.fitness || [],
      notes: result.notes || [],
      goals: result.goals || [],
    }

    // Cache the pattern for future similar inputs
    patternCache.set(cacheKey, parsed)

    return parsed
  } catch {
    return { tasks: [], habits: [], nutrition: [], fitness: [], notes: [], goals: [] }
  }
}

// Batch parsing for multiple entries - minimizes API calls
export async function batchParseInputs(inputs: string[]): Promise<ParsedInput[]> {
  if (inputs.length === 0) return []
  if (inputs.length === 1) return [await parseUserInput(inputs[0])]

  // Combine inputs with delimiters for batch processing
  const batchPrompt = `Parse each entry (separated by |||) into JSON array. Each entry maps to one object in array.
Output: [{"tasks":[],"habits":[],"nutrition":[],"fitness":[],"notes":[],"goals":[]}, ...]
Return JSON array only.`

  const combinedInput = inputs.map((input, i) => `Entry ${i + 1}: ${input}`).join(' ||| ')

  const text = await callAI(batchPrompt, combinedInput, 1024)

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const results = JSON.parse(jsonMatch[0])
      return results.map((r: Partial<ParsedInput>) => ({
        tasks: r.tasks || [],
        habits: r.habits || [],
        nutrition: r.nutrition || [],
        fitness: r.fitness || [],
        notes: r.notes || [],
        goals: r.goals || [],
      }))
    }
  } catch {
    // Fallback to individual parsing
    return Promise.all(inputs.map(parseUserInput))
  }

  return Promise.all(inputs.map(parseUserInput))
}

// Re-parse edited content - detects changes and updates
export async function reparseIfChanged(
  originalContent: string,
  newContent: string,
  originalParsed: ParsedInput
): Promise<{ changed: boolean; parsed: ParsedInput }> {
  // Normalize for comparison
  const origNorm = normalizeInput(originalContent)
  const newNorm = normalizeInput(newContent)

  if (origNorm === newNorm) {
    return { changed: false, parsed: originalParsed }
  }

  // Content changed, re-parse
  const newParsed = await parseUserInput(newContent)
  return { changed: true, parsed: newParsed }
}

// Compact goals parsing prompt
const GOALS_SYSTEM_PROMPT = `Parse goals hierarchy to JSON:
{"goals":[{title,weight,parent_goal_id}],"tasks":[{title,goal_index}],"habits":[{name,frequency,goal_index}]}
weight=0-100 importance. goal_index links to goals array. Return JSON only.`

export async function parseGoals(input: string): Promise<ParsedGoalsResult> {
  const text = await callAI(GOALS_SYSTEM_PROMPT, input, 512)

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        goals: parsed.goals || [],
        tasks: parsed.tasks || [],
        habits: parsed.habits || [],
      }
    }
    const parsed = JSON.parse(text)
    return {
      goals: parsed.goals || [],
      tasks: parsed.tasks || [],
      habits: parsed.habits || [],
    }
  } catch {
    return { goals: [], tasks: [], habits: [] }
  }
}

export async function summarizeReflections(reflections: string[]): Promise<string> {
  if (reflections.length === 0) return ''

  const systemPrompt = 'Summarize themes from reflections. Be concise. Plain text only.'
  return await callAI(systemPrompt, reflections.join('\n'), 256)
}

// Dedicated nutrition parsing with better macro estimates
const NUTRITION_PARSE_PROMPT = `Parse food items into nutrition data with accurate macro estimates.
You are a nutrition expert. For each food item:
- Identify branded items and use known nutritional values
- For raw/uncooked items (rice, pasta, meat), calculate macros for the COOKED version
- Meat loses ~25% weight when cooked, grains absorb water and ~triple in weight
- Estimate macros per typical serving/amount mentioned
- ALL items must have calories, protein, carbs, fat values (use 0 when applicable)

IMPORTANT macro references:
Food items per 100g cooked:
- Beef mince 10% fat: 176 cal, 26g protein, 0g carbs, 8g fat
- Cooked white rice: 130 cal, 2.7g protein, 28g carbs, 0.3g fat
- Bell pepper: 31 cal, 1g protein, 6g carbs, 0.3g fat
- Red onion: 40 cal, 1.1g protein, 9g carbs, 0.1g fat
- Egg (large ~50g): 78 cal, 6g protein, 0.6g carbs, 5g fat
- American cheese slice (~20g): 70 cal, 4g protein, 1g carbs, 6g fat
- Laughing Cow wedge (~21g): 35 cal, 2g protein, 1g carbs, 2.5g fat
- Olive oil (1 tbsp ~14g): 120 cal, 0g protein, 0g carbs, 14g fat

Alcoholic drinks:
- Pure alcohol: 7 cal per gram (no protein/carbs/fat)
- Whiskey/Bourbon (40% ABV, 30ml shot): 70 cal, 0g protein, 0g carbs, 0g fat
- Vodka/Rum (40% ABV, 30ml shot): 65 cal, 0g protein, 0g carbs, 0g fat
- Beer (330ml, 5%): 140 cal, 1g protein, 12g carbs, 0g fat
- Wine red (150ml): 125 cal, 0g protein, 4g carbs, 0g fat
- Premix RTD (e.g. Wild Turkey, Jack Daniels ~7% 375ml): ~250 cal, 0g protein, 20g carbs, 0g fat

Soft drinks per 330ml can:
- Pepsi Max/Coke Zero/Diet drinks: 0-4 cal, 0g protein, 0g carbs, 0g fat
- Regular Coke/Pepsi: 140 cal, 0g protein, 39g carbs, 0g fat
- Orange juice: 110 cal, 2g protein, 26g carbs, 0g fat

Output ONLY valid JSON array:
[{"food_name":"descriptive name","macros":{"calories":number,"protein":number,"carbs":number,"fat":number,"fiber":number}}]

Parse each ingredient separately. Be specific with amounts. Return JSON only, no explanation.`

export async function parseNutrition(input: string): Promise<Array<{food_name: string, macros: {calories?: number, protein?: number, carbs?: number, fat?: number, fiber?: number}}>> {
  try {
    const text = await callAI(NUTRITION_PARSE_PROMPT, input, 1024)

    // Try to extract JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => ({
          food_name: item.food_name || 'Unknown food',
          macros: {
            calories: Math.round(item.macros?.calories || 0),
            protein: Math.round(item.macros?.protein || 0),
            carbs: Math.round(item.macros?.carbs || 0),
            fat: Math.round(item.macros?.fat || 0),
            fiber: Math.round(item.macros?.fiber || 0),
          }
        }))
      }
    }

    // Fallback: try to parse as object with nutrition array
    const objMatch = text.match(/\{[\s\S]*\}/)
    if (objMatch) {
      const obj = JSON.parse(objMatch[0])
      if (obj.nutrition && Array.isArray(obj.nutrition)) {
        return obj.nutrition
      }
    }

    // Last resort: return basic parsed items without macros
    return input.split(',').map(item => ({
      food_name: item.trim(),
      macros: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    }))
  } catch (error) {
    console.error('Nutrition parsing error:', error)
    // Fallback: split by comma and return without macros
    return input.split(',').map(item => ({
      food_name: item.trim(),
      macros: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    }))
  }
}

// Derive streak data from habit completion history
export function calculateStreak(lastDone: string | null, currentStreak: number): number {
  if (!lastDone) return 0

  const last = new Date(lastDone)
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return currentStreak // Already done today
  if (diffDays === 1) return currentStreak // Done yesterday, streak continues
  return 0 // Streak broken
}

// Calculate goal progress from linked tasks
export function calculateGoalProgress(
  goalId: string,
  tasks: Array<{ goal_id: string | null; completed: boolean }>,
  subGoals: Array<{ id: string; parent_goal_id: string | null; completed: boolean }>
): number {
  const goalTasks = tasks.filter(t => t.goal_id === goalId)
  const childGoals = subGoals.filter(g => g.parent_goal_id === goalId)

  if (goalTasks.length === 0 && childGoals.length === 0) return 0

  let total = 0
  let completed = 0

  // Tasks weight
  if (goalTasks.length > 0) {
    total += goalTasks.length
    completed += goalTasks.filter(t => t.completed).length
  }

  // Sub-goals weight (recursive would need full data)
  if (childGoals.length > 0) {
    total += childGoals.length
    completed += childGoals.filter(g => g.completed).length
  }

  return total > 0 ? Math.round((completed / total) * 100) : 0
}

// Clear pattern cache (for testing/reset)
export function clearPatternCache(): void {
  patternCache.clear()
}
