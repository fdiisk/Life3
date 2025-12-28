import { ParsedInput } from './types'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

async function callAI(systemPrompt: string, userMessage: string, maxTokens = 1024): Promise<string> {
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
      model: 'anthropic/claude-3.5-sonnet',
      max_tokens: maxTokens,
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

export async function parseUserInput(input: string): Promise<ParsedInput> {
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

  const text = await callAI(systemPrompt, input)

  try {
    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(text)
  } catch {
    return { tasks: [], habits: [], nutrition: [], fitness: [], notes: [], goals: [] }
  }
}

export async function parseGoals(input: string): Promise<Partial<ParsedInput>> {
  const systemPrompt = `Parse the input into structured goals with linked tasks and habits.
Return JSON:
{
  "goals": [{title, weight (importance 0-100), parent_goal_id (null for top-level)}],
  "tasks": [{title, goal_index (index in goals array)}],
  "habits": [{name, frequency, goal_index}]
}
Identify hierarchy: main goals → sub-goals → tasks/habits.
Return ONLY valid JSON.`

  const text = await callAI(systemPrompt, input)

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(text)
  } catch {
    return { goals: [], tasks: [], habits: [] }
  }
}

export async function summarizeReflections(reflections: string[]): Promise<string> {
  const systemPrompt = 'Summarize the key themes and patterns from these reflections. Be concise and actionable. Return plain text, not JSON.'

  return await callAI(systemPrompt, reflections.join('\n\n'), 512)
}
