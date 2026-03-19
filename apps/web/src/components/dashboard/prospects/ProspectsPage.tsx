'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type ProspectStatus = 'ACTIVE' | 'QUEUED' | 'LEAD' | 'HOT_LEAD' | 'DORMANT' | 'NO_RESPONSE' | 'SUPPRESSED'

const STATUS_TABS: ProspectStatus[] = ['ACTIVE', 'QUEUED', 'LEAD', 'HOT_LEAD', 'DORMANT', 'NO_RESPONSE']

const STATUS_COLORS: Record<ProspectStatus, string> = {
  ACTIVE: 'bg-blue-500/20 text-blue-400',
  QUEUED: 'bg-yellow-500/20 text-yellow-400',
  LEAD: 'bg-green-500/20 text-green-400',
  HOT_LEAD: 'bg-emerald-500/20 text-emerald-400',
  DORMANT: 'bg-orange-500/20 text-orange-400',
  NO_RESPONSE: 'bg-gray-500/20 text-gray-400',
  SUPPRESSED: 'bg-red-500/20 text-red-400',
}

interface Prospect {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  title: string | null
  companyName: string
  companyDomain: string
  status: ProspectStatus
  dormantReason?: string | null
  reactivateAt?: string | null
  createdAt: string
}

const mockProspects: Prospect[] = [
  { id: '1', firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@fincore.com', title: 'CFO', companyName: 'FinCore Systems', companyDomain: 'fincore.com', status: 'ACTIVE', createdAt: '2026-03-15T10:00:00Z' },
  { id: '2', firstName: 'Marcus', lastName: 'Webb', email: 'mwebb@datavault.com', title: 'CISO', companyName: 'DataVault Corp', companyDomain: 'datavault.com', status: 'LEAD', createdAt: '2026-03-14T09:00:00Z' },
  { id: '3', firstName: 'Jennifer', lastName: 'Park', email: null, title: 'CFO', companyName: 'Atlas Insurance', companyDomain: 'atlasins.com', status: 'QUEUED', createdAt: '2026-03-13T08:00:00Z' },
  { id: '4', firstName: 'David', lastName: 'Torres', email: 'david.torres@pharmanet.com', title: 'Head of Security', companyName: 'PharmaNet', companyDomain: 'pharmanet.com', status: 'DORMANT', dormantReason: 'Mentioned Q1 2026 would be better timing', reactivateAt: '2026-04-01', createdAt: '2026-02-10T10:00:00Z' },
  { id: '5', firstName: 'Lisa', lastName: 'Morrison', email: 'l.morrison@buildco.com', title: 'CFO', companyName: 'BuildCo Industries', companyDomain: 'buildco.com', status: 'NO_RESPONSE', createdAt: '2026-01-20T10:00:00Z' },
]

export function ProspectsPage() {
  const [activeTab, setActiveTab] = useState<ProspectStatus>('ACTIVE')
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)

  const filtered = mockProspects.filter(p => p.status === activeTab)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prospect Pipeline</h1>
          <p className="text-muted text-sm mt-1">{mockProspects.length} total prospects</p>
        </div>
      </div>

      {/* Status tabs */}
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
              {mockProspects.filter(p => p.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Dormant queue special view */}
      {activeTab === 'DORMANT' && (
        <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-sm text-orange-400">
          Dormant prospects will be automatically re-engaged on their reactivation date. Max 3 reactivation cycles.
        </div>
      )}

      {/* Prospect table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
              {activeTab === 'DORMANT' && (
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Dormant Reason</th>
              )}
              {activeTab === 'DORMANT' && (
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Reactivate On</th>
              )}
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(prospect => (
              <tr
                key={prospect.id}
                className="hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setSelectedProspect(prospect)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-white uppercase flex-shrink-0">
                      {prospect.firstName?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {prospect.firstName} {prospect.lastName}
                      </p>
                      <p className="text-xs text-muted">{prospect.email || 'No email'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-white">{prospect.companyName}</p>
                  <p className="text-xs text-muted">{prospect.title}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[prospect.status])}>
                    {prospect.status.replace('_', ' ')}
                  </span>
                </td>
                {activeTab === 'DORMANT' && (
                  <td className="px-4 py-3 text-sm text-muted italic max-w-xs">
                    <span className="line-clamp-1">"{prospect.dormantReason}"</span>
                  </td>
                )}
                {activeTab === 'DORMANT' && (
                  <td className="px-4 py-3 text-sm text-orange-400">
                    {prospect.reactivateAt
                      ? new Date(prospect.reactivateAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'
                    }
                  </td>
                )}
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(prospect.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">No {activeTab.toLowerCase().replace('_', ' ')} prospects.</div>
        )}
      </div>

      {/* Prospect detail drawer */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setSelectedProspect(null)}>
          <div className="w-full max-w-lg bg-sidebar border-l border-border h-full overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Prospect Details</h2>
              <button onClick={() => setSelectedProspect(null)} className="text-muted hover:text-white p-1">✕</button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold text-white uppercase">
                {selectedProspect.firstName?.[0] || '?'}
              </div>
              <div>
                <h3 className="text-white font-semibold">{selectedProspect.firstName} {selectedProspect.lastName}</h3>
                <p className="text-muted text-sm">{selectedProspect.title} at {selectedProspect.companyName}</p>
                <p className="text-accent text-sm">{selectedProspect.email || 'No email found'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Status</h4>
                <span className={cn('text-xs px-2 py-1 rounded-full font-medium', STATUS_COLORS[selectedProspect.status])}>
                  {selectedProspect.status.replace('_', ' ')}
                </span>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Company</h4>
                <p className="text-white text-sm font-medium">{selectedProspect.companyName}</p>
                <p className="text-muted text-sm">{selectedProspect.companyDomain}</p>
              </div>

              {selectedProspect.status === 'DORMANT' && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-orange-400 uppercase tracking-wider mb-3">Dormant Queue</h4>
                  <p className="text-sm text-muted italic mb-2">"{selectedProspect.dormantReason}"</p>
                  <p className="text-sm text-orange-400">
                    Reactivates: {selectedProspect.reactivateAt
                      ? new Date(selectedProspect.reactivateAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : 'Unknown'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
