'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface TimeAllocationChartProps {
  data: { name: string; value: number; hours: number }[]
}

const COLORS: Record<string, string> = {
  work: '#3B82F6',
  health: '#22C55E',
  personal: '#A855F7',
  learning: '#EAB308',
  social: '#EC4899',
  rest: '#6B7280',
}

export default function TimeAllocationChart({ data }: TimeAllocationChartProps) {
  const filteredData = data.filter((d) => d.value > 0)

  if (filteredData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No time blocks recorded
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, hours }) => `${name}: ${hours}h`}
          labelLine={false}
        >
          {filteredData.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] || '#6B7280'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`${Math.round(value)} min`, name]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
