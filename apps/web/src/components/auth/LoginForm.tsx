'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    await signIn('google', { callbackUrl })
  }

  return (
    <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className={cn(
              'w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-white',
              'placeholder:text-muted text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-colors'
            )}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className={cn(
              'w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-white',
              'placeholder:text-muted text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-colors'
            )}
          />
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
            'w-full py-2.5 px-4 rounded-lg font-medium text-sm text-white',
            'bg-primary hover:bg-primary/90 active:bg-primary/80',
            'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            'mt-2'
          )}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-card text-muted">or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className={cn(
          'w-full py-2.5 px-4 rounded-lg font-medium text-sm text-white',
          'bg-background border border-border hover:border-muted',
          'transition-colors flex items-center justify-center gap-2'
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm text-muted mt-6">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="text-accent hover:underline font-medium">
          Start free trial
        </a>
      </p>
    </div>
  )
}
