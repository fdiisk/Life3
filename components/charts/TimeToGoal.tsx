'use client'

interface TimeToGoalProps {
  data: {
    goal: string
    remainingTasks: number
    totalTasks: number
    estimatedDays: number
    progress: number
  }[]
}

export default function TimeToGoal({ data }: TimeToGoalProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        No active goals
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-800 text-sm">{item.goal}</h4>
            <span className={`text-xs px-2 py-1 rounded-full ${
              item.progress >= 75 ? 'bg-green-100 text-green-700' :
              item.progress >= 50 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {item.progress}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${
                item.progress >= 75 ? 'bg-green-500' :
                item.progress >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${item.progress}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>{item.totalTasks - item.remainingTasks} / {item.totalTasks} tasks done</span>
            <span className="font-medium">
              {item.estimatedDays === 0 ? (
                <span className="text-green-600">Complete!</span>
              ) : (
                <span>~{item.estimatedDays} days left</span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
