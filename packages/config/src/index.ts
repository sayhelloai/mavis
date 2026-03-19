import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  QDRANT_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  HUNTER_API_KEY: z.string().min(1),
  APOLLO_API_KEY: z.string().min(1),
  SNOV_API_KEY: z.string().min(1),
  ZEROBOUNCE_API_KEY: z.string().min(1),
  CLEARBIT_API_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }
  return parsed.data
}

export const env = {
  get DATABASE_URL() { return process.env.DATABASE_URL! },
  get REDIS_URL() { return process.env.REDIS_URL! },
  get QDRANT_URL() { return process.env.QDRANT_URL! },
  get ANTHROPIC_API_KEY() { return process.env.ANTHROPIC_API_KEY! },
  get OPENAI_API_KEY() { return process.env.OPENAI_API_KEY! },
  get RESEND_API_KEY() { return process.env.RESEND_API_KEY! },
  get HUNTER_API_KEY() { return process.env.HUNTER_API_KEY! },
  get APOLLO_API_KEY() { return process.env.APOLLO_API_KEY! },
  get SNOV_API_KEY() { return process.env.SNOV_API_KEY! },
  get ZEROBOUNCE_API_KEY() { return process.env.ZEROBOUNCE_API_KEY! },
  get CLEARBIT_API_KEY() { return process.env.CLEARBIT_API_KEY! },
  get NEXTAUTH_SECRET() { return process.env.NEXTAUTH_SECRET! },
  get NEXTAUTH_URL() { return process.env.NEXTAUTH_URL! },
  get NODE_ENV() { return process.env.NODE_ENV || 'development' },
}
