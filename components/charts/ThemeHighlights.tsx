'use client'

interface ThemeHighlightsProps {
  themes: { word: string; count: number }[]
  summary: string
}

export default function ThemeHighlights({ themes, summary }: ThemeHighlightsProps) {
  if (themes.length === 0) {
    return (
      <div className="text-gray-400 text-center py-4">
        Need more reflections to identify themes
      </div>
    )
  }

  const maxCount = Math.max(...themes.map((t) => t.count))

  return (
    <div className="space-y-4">
      {/* AI Summary */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
        <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-2">
          <span>🤖</span> AI Insight
        </h4>
        <p className="text-sm text-purple-700">{summary}</p>
      </div>

      {/* Theme Leaderboard */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-3">Recurring Themes</h4>
        <div className="space-y-2">
          {themes.slice(0, 8).map((theme, index) => (
            <div key={theme.word} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-yellow-400 text-yellow-900' :
                index === 1 ? 'bg-gray-300 text-gray-700' :
                index === 2 ? 'bg-amber-600 text-white' :
                'bg-gray-100 text-gray-600'
              }`}>
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium capitalize">{theme.word}</span>
                  <span className="text-xs text-gray-400">{theme.count}x</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(theme.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
