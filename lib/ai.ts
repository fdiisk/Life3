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
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI API error: ${response.statusText} - ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
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
