import express from 'express'
import { emailDeliveryWorker } from './workers/email_delivery_worker'
import { workflowEngine } from './workers/workflow_engine'
import { meetingSchedulerWorker } from './workers/meeting_scheduler_worker'
import { runMonthlyBudgetReset } from './cron/monthly_reset'

const app = express()
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mavis-worker', timestamp: new Date().toISOString() })
})

// Calendly webhook
app.post('/webhooks/calendly', meetingSchedulerWorker.handleWebhook.bind(meetingSchedulerWorker))

// Manual cron trigger (for testing — in prod, this is triggered by an external scheduler)
app.post('/cron/monthly-reset', async (_req, res) => {
  try {
    await runMonthlyBudgetReset()
    res.json({ success: true })
  } catch (err) {
    console.error('Monthly reset failed:', err)
    res.status(500).json({ success: false, error: 'Reset failed' })
  }
})

const PORT = process.env.WORKER_PORT || 3001

app.listen(PORT, () => {
  console.log(`Mavis Worker running on port ${PORT}`)

  // Start workers
  emailDeliveryWorker.start()
  workflowEngine.start().catch(console.error)
})

export default app
