'use client'

import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

interface SlackNotifyNodeData {
  channel: string
  message: string
}

export function SlackNotifyNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as SlackNotifyNodeData

  return (
    <div className={cn(
      'bg-card border rounded-xl p-4 w-64 shadow-lg',
      selected ? 'border-pink-500' : 'border-border'
    )}>
      <Handle type="target" position={Position.Top} className="!bg-pink-500 !border-pink-500" />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded bg-pink-500/20 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <span className="text-xs font-semibold text-white">Slack Notify</span>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted mb-1">Channel</p>
          <input
            defaultValue={nodeData.channel}
            placeholder="#sales"
            className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Message template</p>
          <textarea
            defaultValue={nodeData.message}
            placeholder="New activity on {company}..."
            rows={2}
            className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none"
          />
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-pink-500 !border-pink-500" />
    </div>
  )
}
