'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatefulButton } from '@/components/ui/stateful-button'
import { PasswordInput } from '@/components/ui/password-input'
import { inputClass } from '@/lib/utils'
import { DEPARTMENTS } from '@/lib/departments'

const labelClass = 'mb-1.5 block text-sm font-medium text-foreground'

/** The one step after the first "Continue with Google": enrollment number and department. */
export function CompleteProfileForm({ googleName }: { googleName: string }) {
  const router = useRouter()
  const [name, setName] = useState(googleName)
  const [enrollment, setEnrollment] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/members/google/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, enrollment, department, ...(needsPassword ? { password } : {}) }),
      })
      const body = await res.json().catch(() => null)

      if (!res.ok) {
        if (body?.expired) {
          router.push('/members/login?error=google-expired')
          return
        }
        if (body?.needsPassword) setNeedsPassword(true)
        throw new Error(body?.error ?? "Couldn't finish setting up your account. Please try again.")
      }

      router.push('/members')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reach the server. Check your connection and try again.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="googleName" className={labelClass}>
          Name
        </label>
        <input
          id="googleName"
          required
          maxLength={80}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="googleEnrollment" className={labelClass}>
          Enrollment number
        </label>
        <input
          id="googleEnrollment"
          required
          maxLength={20}
          autoComplete="off"
          value={enrollment}
          onChange={(e) => setEnrollment(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="googleDepartment" className={labelClass}>
          Department
        </label>
        <input
          id="googleDepartment"
          required
          list="googleDepartmentOptions"
          maxLength={80}
          autoComplete="off"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className={inputClass}
        />
        <datalist id="googleDepartmentOptions">
          {DEPARTMENTS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      {needsPassword && (
        <div>
          <label htmlFor="googleLinkPassword" className={labelClass}>
            Password of the existing account
          </label>
          <PasswordInput
            id="googleLinkPassword"
            required
            maxLength={72}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <StatefulButton
        type="submit"
        size="lg"
        status={submitting ? 'loading' : 'idle'}
        disabled={submitting}
        className="w-full"
      >
        {needsPassword ? 'Connect and continue' : 'Continue'}
      </StatefulButton>
    </form>
  )
}
