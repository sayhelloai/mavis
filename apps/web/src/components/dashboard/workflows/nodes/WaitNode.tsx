'use client'

import { Handle, Position, NodeProps } from '@xyflow/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface WaitNodeData {
  days: number
  businessDaysOnly: boolean
}

export function WaitNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WaitNodeData
  const [days, setDays] = useState(nodeData.days || 3)
  const [businessDaysOnly, setBusinessDaysOnly] = useState(nodeData.businessDaysOnly ?? true)

  return (
    <div className={cn(
      'bg-card border rounded-xl p-4 w-56 shadow-lg',
      selected ? 'border-yellow-500' : 'border-border'
    )}>
      <Handle type="target" position={Position.Top} className="!bg-yellow-500 !border-yellow-500" />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded bg-yellow-500/20 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <span className="text-xs font-semibold text-white">Wait</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input
          type="number"
          value={days}
          onChange={e => setDays(parseInt(e.target.value, 10))}
          min={1}
          max={90}
          className="w-16 bg-background border border-border rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500 text-center"
        />
        <span className="text-sm text-muted">days</span>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => setBusinessDaysOnly(!businessDaysOnly)}
          className={cn(
            'w-8 h-4 rounded-full transition-colors relative',
            businessDaysOnly ? 'bg-yellow-500' : 'bg-border'
          )}
        >
          <div className={cn(
            'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
            businessDaysOnly ? 'translate-x-4' : 'translate-x-0.5'
          )} />
        </div>
        <span className="text-xs text-muted">Business days only</span>
      </label>

      <Handle type="source" position={Position.Bottom} className="!bg-yellow-500 !border-yellow-500" />
    </div>
  )
}
