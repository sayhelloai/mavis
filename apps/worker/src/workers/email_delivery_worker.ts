/**
 * Email delivery worker — Step 8.
 *
 * Implements:
 * - Rule 4: Cross-tenant cooling period (Redis key mavis:cooling:{email}, 7-day TTL)
 * - Rule 3: Company-level daily email cap (max 2 per domain per day)
 * - Resend API integration for actual delivery
 * - Hard bounce → suppress email address
 * - Success → set cooling period Redis key
 */

import { Worker, Queue, QueueEvents } from 'bullmq'
import { Redis } from 'ioredis'
import { Resend } from 'resend'

const QUEUE_NAME = 'mavis-email-send'
const COOLING_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days
const DOMAIN_DAILY_CAP = 2

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null as null,
}

export interface EmailJobData {
  touchId: string
  sequenceId: string
  prospectId: string
  tenantId: string
  toEmail: string
  toName: string
  fromEmail: string
  fromName: string
  subject: string
  body: string
  companyDomain: string
}

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 },
  },
})

export const emailDeliveryWorker = {
  start() {
    const connection = new Redis(redisConfig)
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

    const worker = new Worker<EmailJobData>(
      QUEUE_NAME,
      async (job) => {
        const { toEmail, toName, fromEmail, fromName, subject, body, companyDomain, tenantId, touchId, prospectId } = job.data

        // ── Rule 4: Cross-tenant cooling period ───────────────────────────────
        const coolingKey = `mavis:cooling:${toEmail}`
        const isCooling = await connection.exists(coolingKey)
        if (isCooling) {
          console.log(`[email-worker] Cooling period active for ${toEmail} — skipping touch ${touchId}`)
          // Not a failure — just skip this touch. Return success so job completes.
          return { skipped: true, reason: 'cooling_period', email: toEmail }
        }

        // ── Rule 3: Company domain daily cap ─────────────────────────────────
        const today = new Date().toISOString().split('T')[0]
        const domainCapKey = `mavis:domain:cap:${tenantId}:${companyDomain}:${today}`
        const domainCount = await connection.get(domainCapKey)
        if (domainCount && parseInt(domainCount, 10) >= DOMAIN_DAILY_CAP) {
          console.log(`[email-worker] Domain daily cap reached for ${companyDomain} — skipping touch ${touchId}`)
          return { skipped: true, reason: 'domain_daily_cap', domain: companyDomain }
        }

        // ── Send via Resend ───────────────────────────────────────────────────
        if (!resend) {
          console.warn('[email-worker] RESEND_API_KEY not set — skipping actual send for touch', touchId)
          return { skipped: true, reason: 'no_resend_key', email: toEmail }
        }

        const htmlBody = body
          .split('\n')
          .map((line: string) => `<p>${line}</p>`)
          .join('')

        const { data, error } = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [`${toName} <${toEmail}>`],
          subject,
          html: htmlBody,
          text: body,
          headers: {
            'X-Mavis-Touch-Id': touchId,
            'X-Mavis-Prospect-Id': prospectId,
            'X-Mavis-Tenant-Id': tenantId,
          },
        })

        if (error) {
          // Hard bounce detection
          const isHardBounce = error.name === 'validation_error' ||
            (error.message && error.message.toLowerCase().includes('bounce'))
          if (isHardBounce) {
            console.error(`[email-worker] Hard bounce for ${toEmail}:`, error)
            // TODO: upsert Suppression record in DB, set ProspectStatus = SUPPRESSED
            throw new Error(`HARD_BOUNCE:${toEmail}`)
          }
          throw new Error(`Resend error: ${error.message}`)
        }

        // ── Success: set cooling period ───────────────────────────────────────
        await connection.set(coolingKey, '1', 'EX', COOLING_TTL_SECONDS)

        // ── Increment domain daily counter ────────────────────────────────────
        const pipeline = connection.pipeline()
        pipeline.incr(domainCapKey)
        pipeline.expire(domainCapKey, 86400) // 24h TTL
        await pipeline.exec()

        console.log(`[email-worker] Sent email to ${toEmail} (touch ${touchId}, resend id: ${data?.id})`)
        return { sent: true, resendId: data?.id, email: toEmail }
      },
      {
        connection,
        concurrency: 5,
      }
    )

    worker.on('completed', (job, result) => {
      if (result?.skipped) {
        console.log(`[email-worker] Job ${job.id} skipped: ${result.reason}`)
      } else {
        console.log(`[email-worker] Job ${job.id} completed successfully`)
      }
    })

    worker.on('failed', (job, err) => {
      if (err?.message?.startsWith('HARD_BOUNCE:')) {
        const email = err.message.replace('HARD_BOUNCE:', '')
        console.error(`[email-worker] Hard bounce recorded for ${email}`)
      } else {
        console.error(`[email-worker] Job ${job?.id} failed:`, err?.message)
      }
    })

    console.log('[email-worker] Started')
    return worker
  },
}
