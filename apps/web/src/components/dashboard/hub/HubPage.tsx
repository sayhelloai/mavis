'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface HubAsset {
  id: string
  name: string
  fileType: string
  fileSizeBytes: number
  currentVersion: number
  tags: string[]
  expiresAt: string | null
  isArchived: boolean
  downloadMode: string
  updatedAt: string
  ownerId: string | null
}

const mockAssets: HubAsset[] = [
  { id: '1', name: 'Enterprise Security ROI Calculator', fileType: 'pdf', fileSizeBytes: 2400000, currentVersion: 3, tags: ['security', 'roi', 'enterprise'], expiresAt: '2026-06-01', isArchived: false, downloadMode: 'OPEN', updatedAt: '2026-03-10T10:00:00Z', ownerId: 'u1' },
  { id: '2', name: 'Q1 2026 Product Deck', fileType: 'pptx', fileSizeBytes: 8100000, currentVersion: 5, tags: ['product', 'deck', 'q1-2026'], expiresAt: null, isArchived: false, downloadMode: 'WATERMARKED', updatedAt: '2026-03-15T14:00:00Z', ownerId: 'u1' },
  { id: '3', name: 'FinCore Case Study', fileType: 'pdf', fileSizeBytes: 1200000, currentVersion: 2, tags: ['case-study', 'fintech', 'cfo'], expiresAt: null, isArchived: false, downloadMode: 'OPEN', updatedAt: '2026-02-20T09:00:00Z', ownerId: 'u1' },
  { id: '4', name: 'Compliance Framework Overview', fileType: 'pdf', fileSizeBytes: 3600000, currentVersion: 1, tags: ['compliance', 'soc2', 'framework'], expiresAt: '2026-04-01', isArchived: false, downloadMode: 'VIEW_ONLY', updatedAt: '2026-01-05T10:00:00Z', ownerId: 'u1' },
  { id: '5', name: 'Product Demo Video', fileType: 'mp4', fileSizeBytes: 145000000, currentVersion: 2, tags: ['demo', 'product', 'video'], expiresAt: null, isArchived: false, downloadMode: 'OPEN', updatedAt: '2026-03-01T10:00:00Z', ownerId: 'u1' },
]

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  pptx: '📊',
  docx: '📝',
  mp4: '🎥',
  image: '🖼️',
  default: '📁',
}

const DOWNLOAD_MODE_LABELS: Record<string, string> = {
  OPEN: 'Open',
  WATERMARKED: 'Watermarked',
  REQUIRE_JUSTIFICATION: 'Justification req.',
  VIEW_ONLY: 'View only',
  TIME_LIMITED: 'Time limited',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const diff = new Date(expiresAt).getTime() - Date.now()
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
}

export function HubPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<HubAsset | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filtered = mockAssets.filter(a => {
    if (a.isArchived) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.name.toLowerCase().includes(q) || a.tags.some(t => t.includes(q))
  })

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Hub</h1>
          <p className="text-muted text-sm mt-1">Sales enablement content library · {mockAssets.filter(a => !a.isArchived).length} assets</p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Upload Asset
        </button>
      </div>

      {/* Search + view toggle */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or tag..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex bg-card border border-border rounded-lg p-1">
          {(['grid', 'list'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn('px-3 py-1.5 rounded text-xs font-medium transition-colors', viewMode === mode ? 'bg-primary text-white' : 'text-muted hover:text-white')}
            >
              {mode === 'grid' ? '⊞ Grid' : '☰ List'}
            </button>
          ))}
        </div>
      </div>

      {/* Asset grid / list */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(asset => (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 cursor-pointer transition-colors"
            >
              <div className="text-3xl mb-3">{FILE_ICONS[asset.fileType] || FILE_ICONS.default}</div>
              <h3 className="text-sm font-medium text-white line-clamp-2 mb-2">{asset.name}</h3>
              <div className="flex items-center gap-1 flex-wrap mb-3">
                {asset.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs bg-primary/10 text-accent px-1.5 py-0.5 rounded">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>v{asset.currentVersion} · {formatFileSize(asset.fileSizeBytes)}</span>
                <span className={cn('px-1.5 py-0.5 rounded', isExpiringSoon(asset.expiresAt) ? 'bg-yellow-500/20 text-yellow-400' : 'bg-background text-muted')}>
                  {DOWNLOAD_MODE_LABELS[asset.downloadMode]}
                </span>
              </div>
              {isExpiringSoon(asset.expiresAt) && (
                <div className="mt-2 text-xs text-yellow-400">⚠ Expiring soon</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Asset</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Version</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Size</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Download</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(asset => (
                <tr key={asset.id} className="hover:bg-white/5 cursor-pointer transition-colors" onClick={() => setSelectedAsset(asset)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{FILE_ICONS[asset.fileType] || FILE_ICONS.default}</span>
                      <div>
                        <p className="text-sm text-white">{asset.name}</p>
                        {isExpiringSoon(asset.expiresAt) && <p className="text-xs text-yellow-400">⚠ Expiring soon</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted uppercase">{asset.fileType}</td>
                  <td className="px-4 py-3 text-sm text-muted">v{asset.currentVersion}</td>
                  <td className="px-4 py-3 text-sm text-muted">{formatFileSize(asset.fileSizeBytes)}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-background border border-border rounded px-2 py-0.5 text-muted">{DOWNLOAD_MODE_LABELS[asset.downloadMode]}</span></td>
                  <td className="px-4 py-3 text-xs text-muted">{new Date(asset.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted text-sm">No assets found matching your search.</div>
      )}

      {/* Asset detail drawer */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setSelectedAsset(null)}>
          <div className="w-full max-w-lg bg-sidebar border-l border-border h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Asset Details</h2>
              <button onClick={() => setSelectedAsset(null)} className="text-muted hover:text-white p-1">✕</button>
            </div>

            <div className="p-6">
              {/* Preview placeholder */}
              <div className="bg-background border border-border rounded-xl h-48 flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="text-5xl mb-2">{FILE_ICONS[selectedAsset.fileType] || FILE_ICONS.default}</div>
                  <p className="text-muted text-sm">{selectedAsset.fileType.toUpperCase()} Preview</p>
                </div>
              </div>

              <h3 className="text-white font-semibold text-lg mb-1">{selectedAsset.name}</h3>
              <div className="flex flex-wrap gap-1 mb-4">
                {selectedAsset.tags.map(tag => (
                  <span key={tag} className="text-xs bg-primary/10 text-accent px-2 py-0.5 rounded">{tag}</span>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { label: 'Version', value: `v${selectedAsset.currentVersion}` },
                  { label: 'File size', value: formatFileSize(selectedAsset.fileSizeBytes) },
                  { label: 'Download mode', value: DOWNLOAD_MODE_LABELS[selectedAsset.downloadMode] },
                  { label: 'Last updated', value: new Date(selectedAsset.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                  ...(selectedAsset.expiresAt ? [{ label: 'Expires', value: new Date(selectedAsset.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }] : []),
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted">{item.label}</span>
                    <span className="text-white">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <button className="w-full py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                  Download
                </button>
                <button className="w-full py-2 rounded-lg border border-border text-muted text-sm hover:text-white transition-colors">
                  Version History
                </button>
              </div>

              {/* Comments section */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-medium text-white mb-3">Comments</h4>
                <div className="text-center py-4 text-muted text-sm">No comments yet.</div>
                <div className="mt-3">
                  <textarea
                    placeholder="Add a comment..."
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                  <button className="mt-2 px-4 py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors">Post</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setUploadModalOpen(false)}>
          <div className="bg-sidebar border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Upload Asset</h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-muted hover:text-white">✕</button>
            </div>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center mb-4 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="text-3xl mb-2">📁</div>
              <p className="text-white text-sm font-medium">Drop files here or click to browse</p>
              <p className="text-muted text-xs mt-1">PDF, PPTX, DOCX, MP4, Images — max 200MB</p>
            </div>
            <input
              placeholder="Asset name"
              className="w-full mb-3 px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">Upload</button>
              <button onClick={() => setUploadModalOpen(false)} className="px-4 py-2 rounded-lg border border-border text-muted text-sm hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
