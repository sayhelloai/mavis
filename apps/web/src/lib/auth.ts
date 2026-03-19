import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  const role = (session.user as any).role
  if (role !== 'COMPANY_ADMIN') {
    redirect('/')
  }
  return session
}

export function getTenantId(session: any): string {
  const tenantId = session?.user?.tenantId
  if (!tenantId) throw new Error('No tenantId in session')
  return tenantId
}
