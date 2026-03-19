/**
 * Workflow engine — Step 8.
 *
 * Runs every 15 minutes via BullMQ repeating job.
 * For each ACTIVE sequence:
 *   - Checks if next touch is due
 *   - Evaluates condition branches (opened/replied/not-opened)
 *   - Schedules email send via emailQueue
 *   - Marks sequence complete when all touches sent or goal reached
 *   - Activates QUEUED sequences when capacity opens up (Rule 5)
 *
 * Rule 5 concurrent caps:
 *   FREE_TRIAL: 10
 *   INTENT_INTEL: 0
 *   STARTER: 150
 *   GROWTH: 750
 *   SCALE: 3000
 */

import { Worker, Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { emailQueue } from './email_delivery_worker'

const QUEUE_NAME = 'mavis-workflow-tick'
const TICK_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

const CONCURRENT_CAPS: Record<string, number> = {
  FREE_TRIAL: 10,
  INTENT_INTEL: 0,
  STARTER: 150,
  GROWTH: 750,
  SCALE: 3000,
  ENTERPRISE: Infinity,
}

// Default touch delays in business days
const TOUCH_DELAYS_DAYS = [0, 3, 7] // Touch 1: immediate, Touch 2: +3d, Touch 3: +7d

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null as null,
}

export const workflowQueue = new Queue(QUEUE_NAME, {
  connection: redisConfig,
})

interface SequenceTickData {
  tenantId?: string
}

export const workflowEngine = {
  async start() {
    const connection = new Redis(redisConfig)

    // Register repeating tick job
    await workflowQueue.add(
      'tick',
      {},
      {
        repeat: { every: TICK_INTERVAL_MS },
        jobId: 'workflow-tick-repeating',
      }
    )

    const worker = new Worker<SequenceTickData>(
      QUEUE_NAME,
      async (_job) => {
        console.log('[workflow-engine] Tick started at', new Date().toISOString())

        // TODO: In a real implementation, query DB for ACTIVE sequences
        // and process each one. Stubbed here until DB connection is added.
        await _processActiveSequences(connection)

        console.log('[workflow-engine] Tick complete')
      },
      { connection }
    )

    worker.on('failed', (job, err) => {
      console.error(`[workflow-engine] Job ${job?.id} failed:`, err?.message)
    })

    console.log('[workflow-engine] Started — ticking every 15 minutes')
    return worker
  },
}

async function _processActiveSequences(redis: Redis): Promise<void> {
  /**
   * Process all ACTIVE sequences:
   * 1. Check if next touch is due based on scheduledAt
   * 2. Check condition branches (opened/not-opened)
   * 3. Enqueue email send if due
   * 4. Mark sequence COMPLETED if all touches sent
   * 5. Activate QUEUED sequences if capacity available (Rule 5)
   *
   * Full DB integration to be completed in Step 9 when Prisma is wired up.
   */

  // Stub: log that the engine ran
  console.log('[workflow-engine] Processing active sequences...')

  // Rule 5 example logic (to be wired to real DB):
  // const activeCounts = await prisma.emailSequence.groupBy({
  //   by: ['tenantId'],
  //   where: { status: 'ACTIVE' },
  //   _count: true,
  // })
  // for (const { tenantId, _count } of activeCounts) {
  //   const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  //   const cap = CONCURRENT_CAPS[tenant.plan] ?? 0
  //   const available = cap - _count.id
  //   if (available > 0) {
  //     const queued = await prisma.emailSequence.findMany({
  //       where: { tenantId, status: 'QUEUED' },
  //       orderBy: { createdAt: 'asc' },
  //       take: available,
  //     })
  //     for (const seq of queued) {
  //       await prisma.emailSequence.update({ where: { id: seq.id }, data: { status: 'ACTIVE' } })
  //     }
  //   }
  // }
}

export function isDue(scheduledAt: Date | null): boolean {
  if (!scheduledAt) return false
  return new Date() >= scheduledAt
}

export function nextTouchDate(lastSentAt: Date, touchIndex: number, businessDaysOnly = false): Date {
  const delayDays = TOUCH_DELAYS_DAYS[touchIndex] ?? 7
  const result = new Date(lastSentAt)

  if (!businessDaysOnly) {
    result.setDate(result.getDate() + delayDays)
    return result
  }

  // Business days calculation (skip weekends)
  let added = 0
  while (added < delayDays) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++ // skip Sunday=0, Saturday=6
  }
  return result
}
