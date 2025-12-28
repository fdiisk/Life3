import { ParsedInput } from './types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

export async function parseUserInput(input: string): Promise<ParsedInput> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const systemPrompt = `You are an AI assistant that parses user input into structured life management data.
Parse the input and return a JSON object with these arrays:
- tasks: [{title, due_date (ISO string or null), goal_id (null)}]
- habits: [{name, frequency ("daily"|"weekly"|"monthly")}]
- nutrition: [{food_name, macros: {calories, protein, carbs, fat, fiber}}]
- fitness: [{exercise_name, sets, reps, weight, cardio_minutes}]
- notes: [{content}]
- goals: [{title, weight (0-100)}]

Rules:
- Extract ALL relevant items from the input
- For nutrition, estimate macros if not provided
- For fitness, parse exercise details (e.g., "bench press 3x10 135lbs")
- Identify goals vs tasks (goals are outcomes, tasks are actions)
- Return ONLY valid JSON, no markdown or explanation`

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: input }],
    }),
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`)
  }

  const data = await response.json()
  const text = data.content[0]?.text || '{}'

  try {
    return JSON.parse(text)
  } catch {
    return { tasks: [], habits: [], nutrition: [], fitness: [], notes: [], goals: [] }
  }
}

export async function parseGoals(input: string): Promise<Partial<ParsedInput>> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const systemPrompt = `Parse the input into structured goals with linked tasks and habits.
Return JSON:
{
  "goals": [{title, weight (importance 0-100), parent_goal_id (null for top-level)}],
  "tasks": [{title, goal_index (index in goals array)}],
  "habits": [{name, frequency, goal_index}]
}
Identify hierarchy: main goals → sub-goals → tasks/habits.
Return ONLY valid JSON.`

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: input }],
    }),
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`)
  }

  const data = await response.json()
  const text = data.content[0]?.text || '{}'

  try {
    return JSON.parse(text)
  } catch {
    return { goals: [], tasks: [], habits: [] }
  }
}

export async function summarizeReflections(reflections: string[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: 'Summarize the key themes and patterns from these reflections. Be concise and actionable.',
      messages: [{ role: 'user', content: reflections.join('\n\n') }],
    }),
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.content[0]?.text || 'No patterns identified yet.'
}
