/**
 * Monthly prospect budget reset cron — Rule 1.
 *
 * Runs at 00:00 UTC on the 1st of each month.
 * - Computes unused = prospectBudget - prospectUsed
 * - Adds unused to prospectRollover (cap at 2 * prospectBudget)
 * - Checks rolloverExpiresAt: if 2 months have passed, expire old rollover
 * - Resets prospectUsed to 0
 * - Clears budget-exhausted flag in Redis
 *
 * To be invoked by a system cron or BullMQ scheduled job.
 */

import { Redis } from 'ioredis'

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null as null,
}

export async function runMonthlyBudgetReset(): Promise<void> {
  const redis = new Redis(redisConfig)

  console.log('[monthly-reset] Starting monthly budget reset at', new Date().toISOString())

  try {
    /**
     * TODO: Wire to Prisma in Step 9.
     *
     * const tenants = await prisma.tenant.findMany({
     *   where: { isTrial: false }
     * })
     *
     * for (const tenant of tenants) {
     *   const unused = Math.max(0, tenant.prospectBudget - tenant.prospectUsed)
     *   const now = new Date()
     *   const twoMonthsAgo = new Date(now)
     *   twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
     *
     *   // Expire old rollover if 2 months have passed
     *   let currentRollover = tenant.prospectRollover
     *   if (tenant.rolloverExpiresAt && tenant.rolloverExpiresAt < now) {
     *     currentRollover = 0 // forfeit expired rollover
     *   }
     *
     *   const newRollover = Math.min(
     *     currentRollover + unused,
     *     tenant.prospectBudget * 2  // cap at 2x budget
     *   )
     *
     *   const nextExpiry = new Date(now)
     *   nextExpiry.setMonth(nextExpiry.getMonth() + 2)
     *
     *   await prisma.tenant.update({
     *     where: { id: tenant.id },
     *     data: {
     *       prospectUsed: 0,
     *       prospectRollover: newRollover,
     *       rolloverExpiresAt: nextExpiry,
     *     }
     *   })
     *
     *   // Clear budget-exhausted flag
     *   await redis.del(`mavis:budget:exhausted:${tenant.id}`)
     *
     *   console.log(`[monthly-reset] Tenant ${tenant.id}: rolled over ${unused} credits, new rollover=${newRollover}`)
     * }
     */

    console.log('[monthly-reset] Budget reset stub complete (DB wiring pending Step 9)')
  } finally {
    await redis.quit()
  }
}

/**
 * Check if a tenant's budget is exhausted.
 * Used by Stage 3 before running enrichment.
 */
export async function isBudgetExhausted(tenantId: string, redis: Redis): Promise<boolean> {
  const key = `mavis:budget:exhausted:${tenantId}`
  const val = await redis.get(key)
  return val === '1'
}

/**
 * Atomically increment a tenant's prospect usage counter.
 * Returns the new count.
 */
export async function incrementProspectUsed(tenantId: string, redis: Redis): Promise<number> {
  const key = `mavis:prospect:used:${tenantId}`
  const newCount = await redis.incr(key)
  return newCount
}

/**
 * Get current prospect usage from Redis.
 */
export async function getProspectUsed(tenantId: string, redis: Redis): Promise<number> {
  const key = `mavis:prospect:used:${tenantId}`
  const val = await redis.get(key)
  return val ? parseInt(val, 10) : 0
}
