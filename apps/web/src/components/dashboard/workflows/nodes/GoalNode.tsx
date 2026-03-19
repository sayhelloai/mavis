'use client'

import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

const GOAL_TYPES = [
  { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'positive_reply', label: 'Positive Reply' },
  { value: 'deal_created', label: 'Deal Created' },
  { value: 'sequence_exhausted', label: 'Sequence Exhausted' },
]

interface GoalNodeData {
  goalType: string
  label: string
}

export function GoalNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as GoalNodeData
  const goal = GOAL_TYPES.find(g => g.value === nodeData.goalType) || GOAL_TYPES[0]

  return (
    <div className={cn(
      'bg-card border rounded-xl p-4 w-52 shadow-lg',
      selected ? 'border-green-500' : 'border-border'
    )}>
      <Handle type="target" position={Position.Top} className="!bg-green-500 !border-green-500" />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span className="text-xs font-semibold text-white">Goal</span>
      </div>

      <div>
        <p className="text-xs text-muted mb-1">Terminal state</p>
        <select
          defaultValue={nodeData.goalType}
          className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {GOAL_TYPES.map(g => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
