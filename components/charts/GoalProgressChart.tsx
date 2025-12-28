'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

interface GoalProgressChartProps {
  data: {
    name: string
    progress: number
    weight: number
    weightedProgress: number
    completed: boolean
  }[]
}

export default function GoalProgressChart({ data }: GoalProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No goals set yet
      </div>
    )
  }

  const getColor = (progress: number, completed: boolean) => {
    if (completed) return '#22C55E'
    if (progress >= 75) return '#84CC16'
    if (progress >= 50) return '#EAB308'
    if (progress >= 25) return '#F97316'
    return '#EF4444'
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6B7280' }} unit="%" />
          <YAxis dataKey="name" type="category" tick={{ fill: '#6B7280', fontSize: 12 }} width={120} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'progress') return [`${value}%`, 'Progress']
              return [`${value}%`, 'Weighted']
            }}
          />
          <Bar dataKey="progress" radius={[0, 4, 4, 0]} name="Progress">
            {data.map((entry, index) => (
              <Cell key={index} fill={getColor(entry.progress, entry.completed)} />
            ))}
            <LabelList dataKey="progress" position="right" formatter={(v: number) => `${v}%`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-sm text-gray-500 text-center">
        Weight-adjusted total: {Math.round(data.reduce((acc, d) => acc + d.weightedProgress, 0) / data.length)}%
      </div>
    </div>
  )
}
