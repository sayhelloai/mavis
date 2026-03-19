/**
 * Meeting scheduler worker — Step 8.
 *
 * Handles Calendly webhook events on booking confirmation:
 * 1. Set prospect.status = HOT_LEAD
 * 2. Trigger Account Intelligence Report generation (stub)
 * 3. Notify assigned rep via Slack webhook
 *
 * Calendly sends POST to /webhooks/calendly with event data.
 */

import { Request, Response } from 'express'
import axios from 'axios'

interface CalendlyEvent {
  event: string
  payload: {
    event_type?: { name: string }
    event?: {
      start_time: string
      end_time: string
      location?: { join_url?: string }
    }
    invitee?: {
      email: string
      name: string
      questions_and_answers?: Array<{ question: string; answer: string }>
    }
    tracking?: {
      utm_content?: string // We store prospectId here
    }
  }
}

export const meetingSchedulerWorker = {
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const event = req.body as CalendlyEvent

    try {
      if (event.event !== 'invitee.created') {
        // Only handle booking confirmations
        res.json({ received: true, processed: false })
        return
      }

      const { payload } = event
      const prospectId = payload.tracking?.utm_content
      const inviteeEmail = payload.invitee?.email
      const inviteeName = payload.invitee?.name
      const startTime = payload.event?.start_time
      const eventTypeName = payload.event_type?.name || 'Meeting'
      const joinUrl = payload.event?.location?.join_url

      console.log(
        `[meeting-scheduler] Booking confirmed: ${inviteeName} <${inviteeEmail}>, event=${eventTypeName}, prospectId=${prospectId}`
      )

      // ── Step 1: Update prospect status to HOT_LEAD ─────────────────────────
      if (prospectId) {
        await _updateProspectToHotLead(prospectId, inviteeEmail || '')
      }

      // ── Step 2: Trigger Account Intelligence Report ────────────────────────
      if (inviteeEmail) {
        await _triggerAccountIntelligenceReport({
          prospectId,
          inviteeEmail,
          inviteeName: inviteeName || '',
          meetingTime: startTime || '',
          eventTypeName,
        })
      }

      // ── Step 3: Notify assigned rep via Slack ─────────────────────────────
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
      if (slackWebhookUrl) {
        await _notifySlack(slackWebhookUrl, {
          inviteeName: inviteeName || 'Unknown',
          inviteeEmail: inviteeEmail || 'Unknown',
          eventTypeName,
          startTime: startTime || 'TBD',
          joinUrl,
          prospectId,
        })
      }

      res.json({ received: true, processed: true, prospectId })
    } catch (err) {
      console.error('[meeting-scheduler] Webhook processing error:', err)
      // Return 200 to prevent Calendly from retrying for our errors
      res.json({ received: true, processed: false, error: 'Internal processing error' })
    }
  },
}

async function _updateProspectToHotLead(prospectId: string, email: string): Promise<void> {
  /**
   * Update prospect status to HOT_LEAD in the database.
   * TODO: Wire to Prisma in Step 9.
   * Also cancel active sequences for this prospect (meeting booked = goal achieved).
   */
  console.log(`[meeting-scheduler] Updating prospect ${prospectId} to HOT_LEAD`)
  // await prisma.prospect.update({
  //   where: { id: prospectId },
  //   data: { status: 'HOT_LEAD' },
  // })
  // await prisma.emailSequence.updateMany({
  //   where: { prospectId, status: { in: ['ACTIVE', 'PENDING_REVIEW'] } },
  //   data: { status: 'COMPLETED' },
  // })
}

async function _triggerAccountIntelligenceReport(params: {
  prospectId?: string
  inviteeEmail: string
  inviteeName: string
  meetingTime: string
  eventTypeName: string
}): Promise<void> {
  /**
   * Generate an Account Intelligence Report for the upcoming meeting.
   * Pulls company news, recent LinkedIn activity, key contacts, and
   * relevant Hub content to prepare the rep.
   * TODO: Implement with Claude + Qdrant in Step 12.
   */
  console.log(
    `[meeting-scheduler] Triggering Account Intelligence Report for ${params.inviteeEmail}`
  )
}

async function _notifySlack(
  webhookUrl: string,
  params: {
    inviteeName: string
    inviteeEmail: string
    eventTypeName: string
    startTime: string
    joinUrl?: string
    prospectId?: string
  }
): Promise<void> {
  const formattedTime = params.startTime
    ? new Date(params.startTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : 'TBD'

  const message = {
    text: `:calendar: *New meeting booked!*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:calendar: *New meeting booked via Mavis*\n*Prospect:* ${params.inviteeName} (${params.inviteeEmail})\n*Meeting:* ${params.eventTypeName}\n*Time:* ${formattedTime}${params.joinUrl ? `\n*Join:* ${params.joinUrl}` : ''}`,
        },
      },
      params.prospectId
        ? {
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `Prospect ID: \`${params.prospectId}\`` }],
          }
        : null,
    ].filter(Boolean),
  }

  try {
    await axios.post(webhookUrl, message)
    console.log('[meeting-scheduler] Slack notification sent')
  } catch (err) {
    console.error('[meeting-scheduler] Slack notification failed:', err)
    // Non-fatal — meeting is still booked
  }
}
