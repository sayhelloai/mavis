import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        // TODO: In Step 4, replace with real DB lookup via Prisma
        // For now, accept a hardcoded test user for development
        if (
          parsed.data.email === 'admin@acme.com' &&
          parsed.data.password === 'password123'
        ) {
          return {
            id: 'seed-user-1',
            email: 'admin@acme.com',
            name: 'Admin User',
            tenantId: 'seed-tenant-1',
            role: 'COMPANY_ADMIN',
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as any).tenantId
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).tenantId = token.tenantId
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.sub
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
})
