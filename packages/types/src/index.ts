export type { Plan, UserRole, SignalSource, SignalStage, ProspectStatus, SequenceStatus, DownloadMode } from '@prisma/client'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface TenantContext {
  tenantId: string
  userId: string
  userRole: string
}

export interface ICPQualityResult {
  score: number
  warnings: string[]
  canActivate: boolean
  requiresAcknowledgement: boolean
}

export interface EnrichmentResult {
  found: boolean
  email?: string
  emailVerified?: boolean
  firstName?: string
  lastName?: string
  title?: string
  linkedinUrl?: string
  companyRevenue?: number
  companySize?: number
  companyIndustry?: string
  enrichmentSource?: string
  failedAt?: string
}

export interface EmailTouchContent {
  subject: string
  body: string
}

export interface GeneratedSequence {
  touch1: EmailTouchContent
  touch2: EmailTouchContent
  touch3: EmailTouchContent
}

export type ReplyClassification =
  | 'POSITIVE'
  | 'NEGATIVE'
  | 'QUESTION'
  | 'FUTURE_DATED_DEFERRAL'
  | 'OOO'
  | 'UNSUBSCRIBE'
  | 'HOSTILE'

export interface ClassificationResult {
  classification: ReplyClassification
  confidence: number
  extractedDate?: string
  suppressedByKeyword?: boolean
}

export const CONCURRENT_SEQUENCE_CAPS: Record<string, number> = {
  FREE_TRIAL: 10,
  INTENT_INTEL: 0,
  STARTER: 150,
  GROWTH: 750,
  SCALE: 3000,
  ENTERPRISE: Infinity,
}

export const UNSUBSCRIBE_KEYWORDS = [
  'unsubscribe',
  'opt out',
  'opt-out',
  'remove me',
  'stop emailing',
  'take me off',
  'do not contact',
  'remove from list',
]
