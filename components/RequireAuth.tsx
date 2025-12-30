'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RequireAuthProps {
  children: (userId: string) => React.ReactNode
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedUserId = localStorage.getItem('life3_user_id')
    if (storedUserId) {
      setUserId(storedUserId)
    } else {
      router.push('/')
    }
    setChecking(false)
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  return <>{children(userId)}</>
}
