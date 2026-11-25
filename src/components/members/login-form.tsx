'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatefulButton } from '@/components/ui/stateful-button'
import { PasswordInput } from '@/components/ui/password-input'
import { cn, inputClass } from '@/lib/utils'
import { DEPARTMENTS } from '@/lib/departments'

type Mode = 'signin' | 'signup'

const labelClass = 'mb-1.5 block text-sm font-medium text-foreground'

/** Sign in with a username and password, or create an account (name, username,
 *  enrollment number, department, password). */
export function MemberAuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [enrollment, setEnrollment] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setPassword('')
    setConfirm('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'signup' && password !== confirm) {
      setError("The two passwords don't match.")
      return
    }
    setSubmitting(true)

    try {
      const res = await fetch(mode === 'signin' ? '/api/members/login' : '/api/members/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'signin' ? { username, password } : { name, username, enrollment, department, password }
        ),
      })
      const body = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          body?.error ?? (mode === 'signin' ? "Couldn't sign in. Check your details and try again." : "Couldn't create your account. Try again.")
        )
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
      <div role="group" aria-label="Sign in or create an account" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(
          [
            ['signin', 'Sign in'],
            ['signup', 'Create account'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => switchMode(value)}
            className={cn(
              'min-h-9 rounded-md text-sm font-medium transition-colors',
              mode === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'signup' && (
        <div>
          <label htmlFor="memberName" className={labelClass}>
            Name
          </label>
          <input
            id="memberName"
            name="name"
            required
            autoComplete="name"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="memberUsername" className={labelClass}>
          Username
        </label>
        <input
          id="memberUsername"
          name="username"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          minLength={mode === 'signup' ? 3 : undefined}
          maxLength={30}
          pattern={mode === 'signup' ? '[A-Za-z0-9][A-Za-z0-9._\\-]{2,29}' : undefined}
          title={mode === 'signup' ? '3 to 30 letters, digits, dots, dashes or underscores (no spaces)' : undefined}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />
        {mode === 'signup' && (
          <p className="mt-1.5 text-xs text-muted-foreground">3 to 30 letters, digits, dots, dashes or underscores.</p>
        )}
      </div>

      {mode === 'signup' && (
        <>
          <div>
            <label htmlFor="memberEnrollment" className={labelClass}>
              Enrollment number
            </label>
            <input
              id="memberEnrollment"
              name="enrollment"
              required
              autoComplete="off"
              maxLength={20}
              value={enrollment}
              onChange={(e) => setEnrollment(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="memberDepartment" className={labelClass}>
              Department
            </label>
            <input
              id="memberDepartment"
              name="department"
              required
              list="memberDepartmentOptions"
              autoComplete="off"
              maxLength={80}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={inputClass}
            />
            <datalist id="memberDepartmentOptions">
              {DEPARTMENTS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
        </>
      )}

      <div>
        <label htmlFor="memberPassword" className={labelClass}>
          Password
        </label>
        <PasswordInput
          id="memberPassword"
          name="password"
          required
          minLength={mode === 'signup' ? 8 : undefined}
          maxLength={72}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === 'signup' && <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>}
      </div>

      {mode === 'signup' && (
        <div>
          <label htmlFor="memberConfirm" className={labelClass}>
            Confirm password
          </label>
          <PasswordInput
            id="memberConfirm"
            name="confirm"
            required
            maxLength={72}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
        {mode === 'signin' ? 'Sign in' : 'Create account'}
      </StatefulButton>

      <p className="text-center text-xs text-muted-foreground">
        Only you can see your own projects, photos and achievements in this portal.
      </p>
    </form>
  )
}
