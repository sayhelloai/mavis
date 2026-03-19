'use client'

import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

const CRM_ACTIONS = [
  'update_deal_stage',
  'create_task',
  'log_note',
  'update_contact_field',
]

interface CRMActionNodeData {
  action: string
  value: string
}

export function CRMActionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CRMActionNodeData

  return (
    <div className={cn(
      'bg-card border rounded-xl p-4 w-60 shadow-lg',
      selected ? 'border-orange-500' : 'border-border'
    )}>
      <Handle type="target" position={Position.Top} className="!bg-orange-500 !border-orange-500" />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded bg-orange-500/20 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <span className="text-xs font-semibold text-white">CRM Action</span>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted mb-1">Action</p>
          <select
            defaultValue={nodeData.action}
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {CRM_ACTIONS.map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Value</p>
          <input
            defaultValue={nodeData.value}
            placeholder="e.g. Qualified"
            className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-orange-500 !border-orange-500" />
    </div>
  )
}
