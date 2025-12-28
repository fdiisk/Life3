import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Help & Guide</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Back to Dashboard
          </Link>
        </header>

        <div className="space-y-6">
          {/* Setup */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">First Time Setup</h2>
            <p className="text-gray-600 mb-4">
              If you&apos;re seeing 500 errors, you need to set up the database:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Go to your <strong>Supabase Dashboard</strong></li>
              <li>Click on <strong>SQL Editor</strong></li>
              <li>Copy the contents of <code className="bg-gray-100 px-1 rounded">supabase/schema.sql</code></li>
              <li>Paste and click <strong>Run</strong></li>
              <li>Refresh the Life3 app</li>
            </ol>
          </section>

          {/* Daily Flow */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Daily Flow</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-medium text-gray-800">Morning Routine</h3>
                <p>Opens automatically before noon. Complete gratitude entries, review goals, rate your values alignment, and check off morning habits.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Throughout the Day</h3>
                <p>Use the Daily Planner to schedule time blocks. Click any hour to add a block. Log nutrition, fitness, and capture quick notes.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Evening Review</h3>
                <p>Available after 6 PM. Review your day, log wins, reflect on challenges, and plan for tomorrow.</p>
              </div>
            </div>
          </section>

          {/* Goals */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Goals System</h2>
            <div className="space-y-3 text-gray-600">
              <p><strong>Creating Goals:</strong> Type your goal in the Goals section and press Enter or click Add.</p>
              <p><strong>Weight (Priority):</strong> Each goal has a weight from 1-100. Higher weight = higher priority. Adjust in Settings.</p>
              <p><strong>Sub-goals:</strong> When creating a goal, select a parent goal to create a hierarchy.</p>
              <p><strong>Linking Tasks:</strong> Tasks can be linked to goals. When you complete tasks linked to a goal, progress increases.</p>
              <p><strong>Completing:</strong> Click the checkbox next to a goal to mark it complete.</p>
            </div>
          </section>

          {/* Habits */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Habits & Streaks</h2>
            <div className="space-y-3 text-gray-600">
              <p><strong>Adding Habits:</strong> Type habit name, select frequency (daily/weekly/monthly), and click Add.</p>
              <p><strong>Completing:</strong> Check off habits to mark them done. This builds your streak.</p>
              <p><strong>Streaks:</strong> Complete habits on consecutive days to build streaks. Missing a day resets the streak.</p>
              <p><strong>Morning Habits:</strong> Habits with &quot;morning&quot;, &quot;wake&quot;, or &quot;meditation&quot; in the name appear in the Morning Routine.</p>
            </div>
          </section>

          {/* Values */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Core Values</h2>
            <div className="space-y-3 text-gray-600">
              <p>Values are what matter most to you. Rate how aligned you feel with each value (1-10) during morning and evening check-ins.</p>
              <p><strong>Customizing:</strong> Go to Settings → Values to add or remove your core values.</p>
              <p><strong>Tracking:</strong> The Analytics page shows trends in your value alignment over time.</p>
            </div>
          </section>

          {/* Weight Tracking */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Weight Tracking</h2>
            <div className="space-y-3 text-gray-600">
              <p>Go to Settings → Weight to log your weight and set a target.</p>
              <p>A chart shows your progress over time with the target as a dashed line.</p>
            </div>
          </section>

          {/* Quick Capture */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Capture (AI Parsing)</h2>
            <div className="space-y-3 text-gray-600">
              <p>Type anything in the capture box and AI will parse it into the right category:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>&quot;Buy groceries tomorrow&quot; → Creates a task</li>
                <li>&quot;Start meditating daily&quot; → Creates a habit</li>
                <li>&quot;Had chicken salad 400cal&quot; → Logs nutrition</li>
                <li>&quot;Ran 5k in 25 min&quot; → Logs fitness</li>
                <li>&quot;Feeling grateful for...&quot; → Creates a note</li>
              </ul>
            </div>
          </section>

          {/* Date Navigation */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Date Navigation</h2>
            <div className="space-y-3 text-gray-600">
              <p>Use the date picker at the top of the dashboard to view data from past days.</p>
              <p>Click the arrows to go forward/backward one day, or click &quot;Today&quot; to return to the current date.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
