'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface NutritionChartProps {
  data: Array<{ date: string; calories: number; protein: number; carbs: number; fat: number }>
}

export default function NutritionChart({ data }: NutritionChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No nutrition data yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Calories Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">Calories</h4>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="calories" stroke="#22C55E" fill="#22C55E" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Macros Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">Macros (g)</h4>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="protein" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
            <Area type="monotone" dataKey="carbs" stackId="1" stroke="#EAB308" fill="#EAB308" fillOpacity={0.6} />
            <Area type="monotone" dataKey="fat" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
