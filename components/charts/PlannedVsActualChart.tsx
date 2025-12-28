'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PlannedVsActualChartProps {
  data: { name: string; planned: number; completed: number }[]
}

export default function PlannedVsActualChart({ data }: PlannedVsActualChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={8}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
        <YAxis tick={{ fill: '#6B7280' }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="planned" fill="#94A3B8" name="Planned" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" fill="#22C55E" name="Completed" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
