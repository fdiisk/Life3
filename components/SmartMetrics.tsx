'use client'

import { useState, useEffect } from 'react'

interface MetricsData {
  streaks: Record<string, number>
  goalProgress: Record<string, number>
  valuesTrend: Record<string, number[]>
  todayEfficiency: number
  activeHabits: number
  completedTasks: number
  totalTasks: number
}

interface SmartMetricsProps {
  metrics: MetricsData | null
  suggestedWidgets: string[]
  loading?: boolean
}

export default function SmartMetrics({
  metrics,
  suggestedWidgets,
  loading = false,
}: SmartMetricsProps) {
  const [expanded, setExpanded] = useState(false)

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-gray-100 rounded" />
            <div className="h-16 bg-gray-100 rounded" />
            <div className="h-16 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const topStreaks = Object.entries(metrics.streaks)
    .filter(([_, streak]) => streak > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const avgGoalProgress = Object.values(metrics.goalProgress).length > 0
    ? Math.round(Object.values(metrics.goalProgress).reduce((a, b) => a + b, 0) / Object.values(metrics.goalProgress).length)
    : 0

  const valuesTrendSummary = Object.entries(metrics.valuesTrend).map(([name, values]) => {
    if (values.length < 2) return { name, trend: 'stable' as const }
    const recent = values[values.length - 1]
    const older = values[0]
    if (recent > older + 1) return { name, trend: 'up' as const }
    if (recent < older - 1) return { name, trend: 'down' as const }
    return { name, trend: 'stable' as const }
  })

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>📈</span> Live Metrics
        </h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          {expanded ? 'Less' : 'More'}
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">
            {metrics.completedTasks}/{metrics.totalTasks}
          </div>
          <div className="text-xs text-green-700">Tasks Today</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {metrics.activeHabits}
          </div>
          <div className="text-xs text-orange-700">Habits Done</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {metrics.todayEfficiency}%
          </div>
          <div className="text-xs text-blue-700">Efficiency</div>
        </div>
      </div>

      {/* Goal Progress */}
      {avgGoalProgress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Overall Goal Progress</span>
            <span className="font-medium">{avgGoalProgress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${avgGoalProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Streaks */}
      {topStreaks.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">🔥 Top Streaks</h3>
          <div className="flex flex-wrap gap-2">
            {topStreaks.map(([id, streak]) => (
              <span
                key={id}
                className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
              >
                {streak} days
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expanded View */}
      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* Values Trend */}
          {valuesTrendSummary.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">💫 Values Trend</h3>
              <div className="grid grid-cols-2 gap-2">
                {valuesTrendSummary.map(({ name, trend }) => (
                  <div key={name} className="flex items-center gap-2 text-sm">
                    <span>
                      {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'}
                    </span>
                    <span className="text-gray-600">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Widgets */}
          {suggestedWidgets.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">✨ Available Insights</h3>
              <div className="flex flex-wrap gap-2">
                {suggestedWidgets.map((widget) => (
                  <span
                    key={widget}
                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                  >
                    {widget.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
