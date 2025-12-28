'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface HabitStreaksChartProps {
  data: { name: string; streak: number; frequency: string }[]
}

export default function HabitStreaksChart({ data }: HabitStreaksChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No habits tracked yet
      </div>
    )
  }

  const getColor = (streak: number) => {
    if (streak >= 30) return '#22C55E'
    if (streak >= 14) return '#84CC16'
    if (streak >= 7) return '#EAB308'
    if (streak >= 3) return '#F97316'
    return '#EF4444'
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis type="number" tick={{ fill: '#6B7280' }} />
        <YAxis dataKey="name" type="category" tick={{ fill: '#6B7280', fontSize: 12 }} width={100} />
        <Tooltip
          formatter={(value: number) => [`${value} days`, 'Streak']}
        />
        <Bar dataKey="streak" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getColor(entry.streak)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
