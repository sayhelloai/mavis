'use client'

import { useCallback, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { cn } from '@/lib/utils'
import { EmailNode } from './nodes/EmailNode'
import { WaitNode } from './nodes/WaitNode'
import { ConditionNode } from './nodes/ConditionNode'
import { GoalNode } from './nodes/GoalNode'
import { CRMActionNode } from './nodes/CRMActionNode'
import { SlackNotifyNode } from './nodes/SlackNotifyNode'

const nodeTypes = {
  email: EmailNode,
  wait: WaitNode,
  condition: ConditionNode,
  goal: GoalNode,
  crmAction: CRMActionNode,
  slackNotify: SlackNotifyNode,
}

const initialNodes = [
  {
    id: 'email-1',
    type: 'email',
    position: { x: 250, y: 50 },
    data: {
      label: 'Touch 1',
      subject: 'Quick question about {company}',
      body: 'Hi {firstName},\n\nI noticed...',
      abEnabled: false,
    },
  },
  {
    id: 'wait-1',
    type: 'wait',
    position: { x: 250, y: 220 },
    data: { days: 3, businessDaysOnly: true },
  },
  {
    id: 'condition-1',
    type: 'condition',
    position: { x: 250, y: 360 },
    data: { condition: 'opened' },
  },
  {
    id: 'email-2',
    type: 'email',
    position: { x: 80, y: 520 },
    data: {
      label: 'Touch 2 (Opened)',
      subject: 'Following up — {company}',
      body: 'Hi {firstName},\n\nSaw you had a chance to check my last note...',
      abEnabled: false,
    },
  },
  {
    id: 'email-3',
    type: 'email',
    position: { x: 420, y: 520 },
    data: {
      label: 'Touch 2 (Not Opened)',
      subject: 'One more thought — {company}',
      body: 'Hi {firstName},\n\nWanted to resurface my last note...',
      abEnabled: false,
    },
  },
  {
    id: 'goal-1',
    type: 'goal',
    position: { x: 250, y: 700 },
    data: { goalType: 'meeting_booked', label: 'Meeting Booked' },
  },
]

const initialEdges = [
  { id: 'e1-w1', source: 'email-1', target: 'wait-1', animated: true },
  { id: 'ew1-c1', source: 'wait-1', target: 'condition-1', animated: true },
  { id: 'ec1-e2', source: 'condition-1', sourceHandle: 'yes', target: 'email-2', label: 'Opened', style: { stroke: '#00A3E0' } },
  { id: 'ec1-e3', source: 'condition-1', sourceHandle: 'no', target: 'email-3', label: 'Not Opened', style: { stroke: '#8B9EC7' } },
  { id: 'ee2-g1', source: 'email-2', target: 'goal-1' },
  { id: 'ee3-g1', source: 'email-3', target: 'goal-1' },
]

const NODE_PALETTE = [
  { type: 'email', label: 'Email', description: 'Send an email touch', color: 'bg-primary/20 border-primary/40' },
  { type: 'wait', label: 'Wait', description: 'Delay before next step', color: 'bg-yellow-500/20 border-yellow-500/40' },
  { type: 'condition', label: 'Condition', description: 'Branch on open/reply', color: 'bg-purple-500/20 border-purple-500/40' },
  { type: 'goal', label: 'Goal', description: 'Terminal success state', color: 'bg-green-500/20 border-green-500/40' },
  { type: 'crmAction', label: 'CRM Action', description: 'Update deal/create task', color: 'bg-orange-500/20 border-orange-500/40' },
  { type: 'slackNotify', label: 'Slack Notify', description: 'Post to Slack channel', color: 'bg-pink-500/20 border-pink-500/40' },
]

export function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [workflowName, setWorkflowName] = useState('New Workflow')
  const [saved, setSaved] = useState(false)

  const onConnect = useCallback(
    (connection: Connection) => setEdges(eds => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  )

  function addNode(type: string) {
    const id = `${type}-${Date.now()}`
    const defaults: Record<string, any> = {
      email: { label: 'Email Touch', subject: '', body: '', abEnabled: false },
      wait: { days: 3, businessDaysOnly: true },
      condition: { condition: 'opened' },
      goal: { goalType: 'meeting_booked', label: 'Meeting Booked' },
      crmAction: { action: 'update_deal_stage', value: '' },
      slackNotify: { channel: '#sales', message: 'New activity on {company}' },
    }
    setNodes(prev => [
      ...prev,
      {
        id,
        type,
        position: { x: 250 + Math.random() * 100, y: 100 + prev.length * 80 },
        data: defaults[type] || {},
      },
    ])
  }

  function handleSave() {
    // TODO: Call API to save workflow
    console.log('Saving workflow:', { name: workflowName, nodes, edges })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="h-14 bg-sidebar border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
        <input
          value={workflowName}
          onChange={e => setWorkflowName(e.target.value)}
          className="bg-transparent text-white font-semibold text-lg focus:outline-none border-b border-transparent focus:border-border"
        />
        <div className="flex-1" />
        <button
          onClick={handleSave}
          className={cn(
            'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
            saved ? 'bg-green-600 text-white' : 'bg-primary text-white hover:bg-primary/90'
          )}
        >
          {saved ? '✓ Saved' : 'Save Workflow'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node palette sidebar */}
        <div className="w-56 bg-sidebar border-r border-border p-4 overflow-y-auto flex-shrink-0">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Add Node</p>
          <div className="space-y-2">
            {NODE_PALETTE.map(item => (
              <button
                key={item.type}
                onClick={() => addNode(item.type)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors hover:opacity-90',
                  item.color
                )}
              >
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-muted text-xs mt-0.5">{item.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* React Flow canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: '#0A1628' }}
          >
            <Background color="#1E3A5F" variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls style={{ background: '#0D1F3C', border: '1px solid #1E3A5F' }} />
            <MiniMap
              style={{ background: '#0D1F3C', border: '1px solid #1E3A5F' }}
              nodeColor="#005C8A"
            />
            <Panel position="top-right">
              <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-muted">
                {nodes.length} nodes · {edges.length} edges
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
