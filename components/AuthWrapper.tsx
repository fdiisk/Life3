'use client'

import { useState, useEffect } from 'react'
import LoginPage from './LoginPage'
import Dashboard from './Dashboard'

export default function AuthWrapper() {
  const [userId, setUserId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check for existing session
    const storedUserId = localStorage.getItem('life3_user_id')
    if (storedUserId) {
      setUserId(storedUserId)
    }
    setChecking(false)
  }, [])

  const handleLogin = (id: string) => {
    setUserId(id)
  }

  const handleLogout = () => {
    localStorage.removeItem('life3_user_id')
    localStorage.removeItem('life3_username')
    setUserId(null)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!userId) {
    return <LoginPage onLogin={handleLogin} />
  }

  return <Dashboard userId={userId} onLogout={handleLogout} />
}
