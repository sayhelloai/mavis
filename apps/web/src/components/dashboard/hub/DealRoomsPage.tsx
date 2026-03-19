'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DealRoom {
  id: string
  name: string
  prospectName: string | null
  prospectEmail: string | null
  slug: string
  expiresAt: string | null
  isRevoked: boolean
  createdAt: string
  assetCount: number
  totalViews: number
  lastViewedAt: string | null
}

const mockRooms: DealRoom[] = [
  { id: '1', name: 'DataVault Corp — Security Platform', prospectName: 'Marcus Webb', prospectEmail: 'mwebb@datavault.com', slug: 'datavault-security-2026', expiresAt: '2026-04-30', isRevoked: false, createdAt: '2026-03-15T10:00:00Z', assetCount: 3, totalViews: 12, lastViewedAt: '2026-03-19T09:00:00Z' },
  { id: '2', name: 'FinCore Systems — CFO Pack', prospectName: 'Sarah Chen', prospectEmail: 'sarah.chen@fincore.com', slug: 'fincore-cfo-pack', expiresAt: null, isRevoked: false, createdAt: '2026-03-10T10:00:00Z', assetCount: 5, totalViews: 28, lastViewedAt: '2026-03-18T14:00:00Z' },
  { id: '3', name: 'Atlas Insurance — Compliance Demo', prospectName: 'Jennifer Park', prospectEmail: 'jpark@atlasins.com', slug: 'atlas-compliance-demo', expiresAt: '2026-03-25', isRevoked: false, createdAt: '2026-02-28T10:00:00Z', assetCount: 2, totalViews: 4, lastViewedAt: null },
]

function getEngagementBadge(views: number): { label: string; class: string } {
  if (views === 0) return { label: 'Not Viewed', class: 'bg-gray-500/20 text-gray-400' }
  if (views < 5) return { label: 'Low', class: 'bg-yellow-500/20 text-yellow-400' }
  if (views < 15) return { label: 'Medium', class: 'bg-blue-500/20 text-blue-400' }
  return { label: 'High', class: 'bg-green-500/20 text-green-400' }
}

export function DealRoomsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<DealRoom | null>(null)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deal Rooms</h1>
          <p className="text-muted text-sm mt-1">Shared microsites for prospects · {mockRooms.length} active</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Room
        </button>
      </div>

      <div className="space-y-3">
        {mockRooms.map(room => {
          const badge = getEngagementBadge(room.totalViews)
          const isExpired = room.expiresAt && new Date(room.expiresAt) < new Date()
          return (
            <div
              key={room.id}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => setSelectedRoom(room)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-medium">{room.name}</h3>
                  <p className="text-muted text-sm mt-0.5">
                    {room.prospectName && `${room.prospectName} · `}{room.prospectEmail}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    /room/{room.slug}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', badge.class)}>
                    {badge.label} engagement
                  </span>
                  {isExpired && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Expired</span>}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-white font-semibold">{room.assetCount}</p>
                  <p className="text-muted text-xs">Assets</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">{room.totalViews}</p>
                  <p className="text-muted text-xs">Views</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">
                    {room.lastViewedAt ? new Date(room.lastViewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </p>
                  <p className="text-muted text-xs">Last viewed</p>
                </div>
                {room.expiresAt && !isExpired && (
                  <div className="text-center">
                    <p className="text-yellow-400 font-semibold">
                      {new Date(room.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-muted text-xs">Expires</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Analytics drawer */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setSelectedRoom(null)}>
          <div className="w-full max-w-lg bg-sidebar border-l border-border h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Room Analytics</h2>
              <button onClick={() => setSelectedRoom(null)} className="text-muted hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="text-white font-medium">{selectedRoom.name}</h3>
              <p className="text-muted text-sm">{selectedRoom.prospectName} · {selectedRoom.prospectEmail}</p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Views', value: selectedRoom.totalViews },
                  { label: 'Assets', value: selectedRoom.assetCount },
                  { label: 'Avg Time', value: '4m 32s' },
                ].map(stat => (
                  <div key={stat.label} className="bg-card border border-border rounded-lg p-3 text-center">
                    <p className="text-white font-semibold text-lg">{stat.value}</p>
                    <p className="text-muted text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Page heatmap placeholder */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Page Engagement</h4>
                <div className="space-y-2">
                  {['Page 1 — Cover', 'Page 2 — Problem', 'Page 3 — Solution', 'Page 4 — ROI Calculator', 'Page 5 — Next Steps'].map((page, i) => {
                    const pct = [95, 82, 71, 64, 45][i]
                    return (
                      <div key={page} className="flex items-center gap-3">
                        <span className="text-xs text-muted w-40 truncate">{page}</span>
                        <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted w-8 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`/room/${selectedRoom.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-lg border border-border text-muted text-sm text-center hover:text-white transition-colors"
                >
                  Open Room ↗
                </a>
                <button className="flex-1 py-2 rounded-lg bg-red-600/20 border border-red-600/30 text-red-400 text-sm hover:bg-red-600/30 transition-colors">
                  Revoke Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setCreateModalOpen(false)}>
          <div className="bg-sidebar border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Create Deal Room</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-muted hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Room name', placeholder: 'e.g. Acme Corp — Q2 Proposal' },
                { label: 'Prospect name', placeholder: 'Marcus Webb' },
                { label: 'Prospect email', placeholder: 'marcus@company.com' },
                { label: 'Password (optional)', placeholder: 'Leave blank for open access' },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-xs font-medium text-muted mb-1">{field.label}</label>
                  <input
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Expiry date (optional)</label>
                <input type="date" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setCreateModalOpen(false)} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                Create Room
              </button>
              <button onClick={() => setCreateModalOpen(false)} className="px-4 py-2 rounded-lg border border-border text-muted text-sm hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
