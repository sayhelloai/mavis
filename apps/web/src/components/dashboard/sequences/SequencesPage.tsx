'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SequenceReviewCard } from './SequenceReviewCard'

interface TouchContent {
  subject: string
  body: string
}

interface Sequence {
  id: string
  prospectName: string
  prospectEmail: string
  prospectTitle: string
  companyName: string
  status: string
  currentTouch: number
  touch1: TouchContent
  touch2: TouchContent
  touch3: TouchContent
  createdAt: string
}

const mockSequences: Sequence[] = [
  {
    id: 'seq-1',
    prospectName: 'Sarah Chen',
    prospectEmail: 'sarah.chen@fincore.com',
    prospectTitle: 'CFO',
    companyName: 'FinCore Systems',
    status: 'PENDING_REVIEW',
    currentTouch: 0,
    touch1: {
      subject: 'Quick question about FinCore\'s ERP modernization',
      body: 'Hi Sarah,\n\nI saw the LinkedIn announcement about FinCore\'s finance team expansion and ERP modernization initiative. That\'s a significant undertaking.\n\nWe work with CFOs at mid-market financial services companies to accelerate the close process and eliminate manual AP workflows — often cutting month-end close from 10 days to 3.\n\nWould a 15-minute call make sense to see if we\'re a fit for what you\'re building?\n\nBest,\n{rep_name}',
    },
    touch2: {
      subject: 'One more thought — FinCore',
      body: 'Hi Sarah,\n\nJust wanted to surface my previous note. Beyond the ERP migration itself, the biggest pain point we hear from CFOs at your scale is data consolidation — pulling numbers from 5 different systems before you can close.\n\nHappy to share how Meridian Financial (similar size, FS industry) cut their consolidation time by 60%.\n\n{rep_name}',
    },
    touch3: {
      subject: 'Should I check back in a few months?',
      body: 'Hi Sarah,\n\nDon\'t want to keep reaching out if the ERP project has all your bandwidth right now. If you\'d prefer I check back after the migration settles, just say the word.\n\nOtherwise, here\'s my calendar if a quick call makes sense: [link]\n\n{rep_name}',
    },
    createdAt: '2026-03-19T10:00:00Z',
  },
  {
    id: 'seq-2',
    prospectName: 'Marcus Webb',
    prospectEmail: 'mwebb@datavault.com',
    prospectTitle: 'CISO',
    companyName: 'DataVault Corp',
    status: 'ACTIVE',
    currentTouch: 2,
    touch1: {
      subject: 'DataVault\'s Series B — a quick question',
      body: 'Hi Marcus,\n\nCongrats on DataVault\'s $50M Series B. Rapid scaling often creates security posture gaps — new engineers, new infrastructure, new attack surface.\n\nWe help CISOs at Series B+ SaaS companies maintain compliance without slowing down engineering velocity.\n\nWould a quick call make sense this week?\n\nBest,\n{rep_name}',
    },
    touch2: {
      subject: 'Following up — DataVault security posture',
      body: 'Hi Marcus,\n\nJust wanted to resurface my note. One thing that often surprises CISOs post-Series B is how quickly SOC 2 Type II scope expands with new systems.\n\nI\'d love to share how we helped another compliance-focused SaaS company maintain their audit trail through a 3x headcount growth.\n\n{rep_name}',
    },
    touch3: {
      subject: 'Timing off?',
      body: 'Hi Marcus,\n\nLast note from me — if compliance infrastructure isn\'t top of mind right now with the post-raise sprint, completely understandable.\n\nIf you\'d like me to check back in Q3, just say the word. Otherwise, calendar link: [link]\n\n{rep_name}',
    },
    createdAt: '2026-03-18T09:00:00Z',
  },
]

const STATUS_TABS = ['PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']

export function SequencesPage() {
  const [activeTab, setActiveTab] = useState('PENDING_REVIEW')
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null)

  const filtered = mockSequences.filter(s => s.status === activeTab)

  if (selectedSequence) {
    return (
      <div className="p-8">
        <button
          onClick={() => setSelectedSequence(null)}
          className="flex items-center gap-2 text-muted hover:text-white text-sm mb-6 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Back to sequences
        </button>
        <SequenceReviewCard sequence={selectedSequence} onApprove={() => setSelectedSequence(null)} />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sequences</h1>
        <p className="text-muted text-sm mt-1">Review and manage email sequences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card border border-border rounded-lg p-1 w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === tab ? 'bg-primary text-white' : 'text-muted hover:text-white'
            )}
          >
            {tab.replace('_', ' ')}
            <span className="ml-2 text-xs opacity-60">
              {mockSequences.filter(s => s.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'PENDING_REVIEW' && filtered.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-400">
          {filtered.length} sequence{filtered.length > 1 ? 's' : ''} awaiting your review before sending.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(seq => (
          <div
            key={seq.id}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setSelectedSequence(seq)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-white uppercase">
                  {seq.prospectName[0]}
                </div>
                <div>
                  <p className="text-white font-medium">{seq.prospectName}</p>
                  <p className="text-muted text-sm">{seq.prospectTitle} · {seq.companyName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  seq.status === 'PENDING_REVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
                  seq.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                  'bg-gray-500/20 text-gray-400'
                )}>
                  {seq.status.replace('_', ' ')}
                </span>
                <p className="text-xs text-muted mt-1">Touch {seq.currentTouch}/3</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted">Touch 1: <span className="text-white">{seq.touch1.subject}</span></p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">No {activeTab.toLowerCase().replace('_', ' ')} sequences.</div>
        )}
      </div>
    </div>
  )
}
