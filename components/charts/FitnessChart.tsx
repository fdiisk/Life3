'use client'

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface FitnessChartProps {
  data: Array<{ date: string; volume: number; cardio: number; exercises: number }>
}

export default function FitnessChart({ data }: FitnessChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No fitness data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} />
        <YAxis yAxisId="left" tick={{ fill: '#6B7280' }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280' }} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="volume" fill="#3B82F6" name="Volume (lbs)" radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="cardio" stroke="#22C55E" strokeWidth={2} name="Cardio (min)" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
