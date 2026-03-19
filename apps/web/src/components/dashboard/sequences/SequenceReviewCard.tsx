'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TouchContent {
  subject: string
  body: string
}

interface SequenceData {
  id: string
  prospectName: string
  prospectEmail: string
  prospectTitle: string
  companyName: string
  touch1: TouchContent
  touch2: TouchContent
  touch3: TouchContent
}

interface SequenceReviewCardProps {
  sequence: SequenceData
  onApprove: () => void
}

export function SequenceReviewCard({ sequence, onApprove }: SequenceReviewCardProps) {
  const [touches, setTouches] = useState({
    touch1: { ...sequence.touch1 },
    touch2: { ...sequence.touch2 },
    touch3: { ...sequence.touch3 },
  })
  const [editingTouch, setEditingTouch] = useState<'touch1' | 'touch2' | 'touch3' | null>(null)
  const [regenerateDrawerOpen, setRegenerateDrawerOpen] = useState<'touch1' | 'touch2' | 'touch3' | null>(null)
  const [regenerateInstruction, setRegenerateInstruction] = useState('')
  const [approving, setApproving] = useState(false)

  function updateTouch(touch: 'touch1' | 'touch2' | 'touch3', field: 'subject' | 'body', value: string) {
    setTouches(prev => ({
      ...prev,
      [touch]: { ...prev[touch], [field]: value }
    }))
  }

  async function handleApprove() {
    setApproving(true)
    // TODO: Call API to activate sequence
    await new Promise(r => setTimeout(r, 1000))
    setApproving(false)
    onApprove()
  }

  async function handleRegenerate(touchKey: 'touch1' | 'touch2' | 'touch3') {
    // TODO: Call POST /generate-sequence with instruction
    console.log('Regenerating', touchKey, 'with instruction:', regenerateInstruction)
    setRegenerateDrawerOpen(null)
    setRegenerateInstruction('')
  }

  const touchKeys: Array<'touch1' | 'touch2' | 'touch3'> = ['touch1', 'touch2', 'touch3']
  const touchLabels = ['Touch 1 (Day 1)', 'Touch 2 (Day 4)', 'Touch 3 (Day 11)']

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Sequence</h1>
          <p className="text-muted text-sm mt-1">
            {sequence.prospectName} · {sequence.prospectTitle} · {sequence.companyName}
          </p>
        </div>
        <button
          onClick={handleApprove}
          disabled={approving}
          className={cn(
            'px-6 py-2.5 rounded-lg font-medium text-sm text-white',
            'bg-green-600 hover:bg-green-500 active:bg-green-700',
            'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center gap-2'
          )}
        >
          {approving ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Approving...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Approve & Send
            </>
          )}
        </button>
      </div>

      {/* Touch cards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {touchKeys.map((touchKey, i) => {
          const touch = touches[touchKey]
          const isEditing = editingTouch === touchKey

          return (
            <div key={touchKey} className="bg-card border border-border rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">{touchLabels[i]}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingTouch(isEditing ? null : touchKey)}
                    className={cn(
                      'text-xs px-2 py-1 rounded transition-colors',
                      isEditing ? 'bg-primary text-white' : 'text-muted hover:text-white'
                    )}
                  >
                    {isEditing ? 'Done' : 'Edit'}
                  </button>
                  <button
                    onClick={() => setRegenerateDrawerOpen(touchKey)}
                    className="text-xs px-2 py-1 rounded text-muted hover:text-white transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div className="mb-3">
                <p className="text-xs text-muted mb-1">Subject</p>
                {isEditing ? (
                  <input
                    value={touch.subject}
                    onChange={e => updateTouch(touchKey, 'subject', e.target.value)}
                    className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : (
                  <p className="text-sm font-medium text-white">{touch.subject}</p>
                )}
              </div>

              {/* Body */}
              <div className="flex-1">
                <p className="text-xs text-muted mb-1">Body</p>
                {isEditing ? (
                  <textarea
                    value={touch.body}
                    onChange={e => updateTouch(touchKey, 'body', e.target.value)}
                    rows={8}
                    className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                ) : (
                  <p className="text-sm text-muted whitespace-pre-line leading-relaxed">{touch.body}</p>
                )}
              </div>

              {/* Word count */}
              <div className="mt-3 pt-3 border-t border-border">
                <span className={cn(
                  'text-xs',
                  touch.body.split(/\s+/).length > 120 ? 'text-red-400' :
                  touch.body.split(/\s+/).length < 80 ? 'text-yellow-400' : 'text-green-400'
                )}>
                  {touch.body.split(/\s+/).filter(Boolean).length} words
                  {touch.body.split(/\s+/).length > 120 ? ' (too long)' :
                   touch.body.split(/\s+/).length < 80 ? ' (too short)' : ' ✓'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Regenerate drawer */}
      {regenerateDrawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setRegenerateDrawerOpen(null)}>
          <div className="w-full max-w-lg bg-sidebar border border-border rounded-t-xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-1">Regenerate {regenerateDrawerOpen.replace('touch', 'Touch ')}</h3>
            <p className="text-muted text-sm mb-4">Provide instructions for Claude to improve this email.</p>
            <textarea
              value={regenerateInstruction}
              onChange={e => setRegenerateInstruction(e.target.value)}
              placeholder="e.g. Make it shorter, focus more on ROI, add a case study mention..."
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleRegenerate(regenerateDrawerOpen)}
                disabled={!regenerateInstruction.trim()}
                className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={() => setRegenerateDrawerOpen(null)}
                className="px-4 py-2 rounded-lg border border-border text-muted text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
