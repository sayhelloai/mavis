'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { cn } from '@/lib/utils'

export function SignupForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      // Auto sign-in after signup
      await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      router.push('/')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = cn(
    'w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-white',
    'placeholder:text-muted text-sm',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
    'transition-colors'
  )

  return (
    <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white mb-1.5">Full name</label>
          <input id="name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="Sarah Chen" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">Work email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@company.com" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-white mb-1.5">Company name</label>
          <input id="company" name="company" type="text" value={form.company} onChange={handleChange} placeholder="Acme Corp" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-1.5">Password</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" required minLength={8} className={inputClass} />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full py-2.5 px-4 rounded-lg font-medium text-sm text-white mt-2',
            'bg-primary hover:bg-primary/90 active:bg-primary/80',
            'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {loading ? 'Creating account...' : 'Start free trial'}
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{' '}
        <a href="/login" className="text-accent hover:underline font-medium">Sign in</a>
      </p>
    </div>
  )
}
