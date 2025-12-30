'use client'

import RequireAuth from '@/components/RequireAuth'
import SettingsPage from '@/components/SettingsPage'

export default function Settings() {
  return (
    <RequireAuth>
      {(userId) => <SettingsPage userId={userId} />}
    </RequireAuth>
  )
}
