'use client'

import RequireAuth from '@/components/RequireAuth'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <RequireAuth>
      {(userId) => <AnalyticsDashboard userId={userId} />}
    </RequireAuth>
  )
}
