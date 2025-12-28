'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ValuesTrendChartProps {
  data: Array<{ date: string; [key: string]: string | number }>
}

const VALUE_COLORS: Record<string, string> = {
  Focus: '#3B82F6',
  Growth: '#22C55E',
  Respect: '#A855F7',
  Patience: '#EAB308',
  Gratitude: '#EC4899',
}

export default function ValuesTrendChart({ data }: ValuesTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No value ratings yet
      </div>
    )
  }

  // Get all value names from data
  const valueNames = new Set<string>()
  data.forEach((d) => {
    Object.keys(d).forEach((key) => {
      if (key !== 'date') valueNames.add(key)
    })
  })

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 12 }} />
        <YAxis domain={[0, 10]} tick={{ fill: '#6B7280' }} />
        <Tooltip />
        <Legend />
        {Array.from(valueNames).map((name) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={VALUE_COLORS[name] || '#6B7280'}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
