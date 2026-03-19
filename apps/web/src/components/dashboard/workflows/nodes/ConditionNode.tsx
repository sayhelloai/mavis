'use client'

import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

const CONDITIONS = ['opened', 'not_opened', 'replied', 'not_replied', 'clicked', 'bounced']

interface ConditionNodeData {
  condition: string
}

export function ConditionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ConditionNodeData

  return (
    <div className={cn(
      'bg-card border rounded-xl p-4 w-64 shadow-lg',
      selected ? 'border-purple-500' : 'border-border'
    )}>
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !border-purple-500" />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
        </div>
        <span className="text-xs font-semibold text-white">Condition</span>
      </div>

      <div className="mb-3">
        <p className="text-xs text-muted mb-1">Branch on</p>
        <select
          defaultValue={nodeData.condition}
          className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {CONDITIONS.map(c => (
            <option key={c} value={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-accent">Yes branch →</span>
        <span className="text-muted">← No branch</span>
      </div>

      {/* Two source handles for yes/no branches */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: '30%' }}
        className="!bg-accent !border-accent"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: '70%' }}
        className="!bg-muted !border-muted"
      />
    </div>
  )
}
