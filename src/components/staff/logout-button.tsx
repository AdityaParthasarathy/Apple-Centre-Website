'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MotionButton } from '@/components/patterns/motion-link'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await fetch('/api/staff/logout', { method: 'POST' })
    router.push('/staff/login')
    router.refresh()
  }

  return (
    <MotionButton variant="outline" size="sm" onClick={handleLogout} disabled={loading}>
      {loading ? 'Signing out…' : 'Log out'}
    </MotionButton>
  )
}
