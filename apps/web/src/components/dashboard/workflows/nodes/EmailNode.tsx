'use client'

import { Handle, Position, NodeProps } from '@xyflow/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface EmailNodeData {
  label: string
  subject: string
  body: string
  abEnabled: boolean
}

export function EmailNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as EmailNodeData
  const [abEnabled, setAbEnabled] = useState(nodeData.abEnabled || false)

  return (
    <div className={cn(
      'bg-card border rounded-xl p-4 w-72 shadow-lg',
      selected ? 'border-primary' : 'border-border'
    )}>
      <Handle type="target" position={Position.Top} className="!bg-accent !border-accent" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#005C8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <span className="text-xs font-semibold text-white">{nodeData.label || 'Email'}</span>
        </div>
        <button
          onClick={() => setAbEnabled(!abEnabled)}
          className={cn(
            'text-xs px-1.5 py-0.5 rounded transition-colors',
            abEnabled ? 'bg-accent/20 text-accent' : 'text-muted hover:text-white'
          )}
        >
          A/B
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted mb-0.5">Subject</p>
          <p className="text-xs text-white bg-background rounded px-2 py-1 truncate">
            {nodeData.subject || 'Enter subject...'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted mb-0.5">Body preview</p>
          <p className="text-xs text-muted bg-background rounded px-2 py-1 line-clamp-2">
            {nodeData.body || 'Enter email body...'}
          </p>
        </div>
      </div>

      {abEnabled && (
        <div className="mt-2 px-2 py-1 bg-accent/10 border border-accent/20 rounded text-xs text-accent">
          A/B test enabled — variant B configured separately
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-accent !border-accent" />
    </div>
  )
}
