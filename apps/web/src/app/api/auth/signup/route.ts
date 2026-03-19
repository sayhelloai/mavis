import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      )
    }

    const { email, company } = parsed.data
    const domain = email.split('@')[1]

    // TODO: In Step 4, implement real tenant creation with Prisma:
    // 1. Check one trial per domain per 12 months
    // 2. Create Tenant record (isTrial=true, plan=FREE_TRIAL)
    // 3. Hash password and create User record
    // 4. Return success

    // Stub response for now
    return NextResponse.json({
      success: true,
      data: {
        tenantId: 'stub',
        userId: 'stub',
        domain,
        company,
      }
    })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
