'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const SIGNAL_SOURCES = ['REDDIT', 'LINKEDIN', 'NEWS', 'SEC_EDGAR', 'G2', 'TWITTER_X', 'GITHUB', 'JOB_POSTING']

const STAGE_COLORS: Record<string, string> = {
  RAW: 'bg-gray-500/20 text-gray-400',
  SCORED: 'bg-yellow-500/20 text-yellow-400',
  QUALIFIED: 'bg-blue-500/20 text-blue-400',
  ENRICHED: 'bg-purple-500/20 text-purple-400',
  SEQUENCED: 'bg-green-500/20 text-green-400',
  FAILED: 'bg-red-500/20 text-red-400',
}

const mockSignals = [
  { id: '1', companyName: 'DataVault Corp', source: 'NEWS', stage: 'QUALIFIED', icpScore: 91, content: 'DataVault Corp receives $50M Series B to accelerate enterprise security compliance platform.', detectedAt: '2026-03-19T10:00:00Z' },
  { id: '2', companyName: 'FinCore Systems', source: 'LINKEDIN', stage: 'ENRICHED', icpScore: 82, content: 'Excited to announce we are expanding our finance team and modernizing our ERP systems.', detectedAt: '2026-03-19T09:30:00Z' },
  { id: '3', companyName: 'TechFlow Inc', source: 'REDDIT', stage: 'QUALIFIED', icpScore: 78, content: 'Just had a major breach at our company. We need to overhaul our entire security stack ASAP.', detectedAt: '2026-03-19T08:15:00Z' },
  { id: '4', companyName: 'Atlas Insurance', source: 'SEC_EDGAR', stage: 'QUALIFIED', icpScore: 88, content: '10-K filing: Company intends to modernize financial reporting infrastructure in FY2025.', detectedAt: '2026-03-18T16:00:00Z' },
  { id: '5', companyName: 'CloudBase Ltd', source: 'JOB_POSTING', stage: 'RAW', icpScore: null, content: 'Hiring: VP of Information Security - CISSP required, experience with zero trust architecture.', detectedAt: '2026-03-18T14:00:00Z' },
  { id: '6', companyName: 'Meridian Financial', source: 'G2', stage: 'SCORED', icpScore: 55, content: 'Looking for AP automation alternatives. Current solution is too manual.', detectedAt: '2026-03-18T11:00:00Z' },
  { id: '7', companyName: 'DevOps Startup', source: 'GITHUB', stage: 'FAILED', icpScore: 72, content: 'Opened issue: Looking for SIEM integrations for our security monitoring pipeline.', detectedAt: '2026-03-17T09:00:00Z' },
]

export function SignalsPage() {
  const [activeSource, setActiveSource] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState<string | null>(null)

  const filtered = mockSignals.filter(s => {
    if (activeSource && s.source !== activeSource) return false
    if (activeStage && s.stage !== activeStage) return false
    return true
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Signal Monitoring</h1>
        <p className="text-muted text-sm mt-1">Detected buying signals across all sources</p>
      </div>

      {/* Source toggles */}
      <div className="mb-4">
        <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Filter by source</p>
        <div className="flex flex-wrap gap-2">
          {SIGNAL_SOURCES.map(src => (
            <button
              key={src}
              onClick={() => setActiveSource(prev => prev === src ? null : src)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                activeSource === src
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted hover:text-white'
              )}
            >
              {src.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Stage filter */}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Filter by stage</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(STAGE_COLORS).map(stage => (
            <button
              key={stage}
              onClick={() => setActiveStage(prev => prev === stage ? null : stage)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                activeStage === stage
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted hover:text-white'
              )}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Signal table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Source</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Stage</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">ICP Score</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Signal</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Detected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(signal => (
              <tr key={signal.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-white">{signal.companyName}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-background border border-border rounded px-2 py-0.5 text-muted">
                    {signal.source.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STAGE_COLORS[signal.stage])}>
                    {signal.stage}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {signal.icpScore !== null ? (
                    <span className={cn(
                      'text-sm font-semibold',
                      signal.icpScore >= 80 ? 'text-green-400' :
                      signal.icpScore >= 65 ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      {signal.icpScore}
                    </span>
                  ) : (
                    <span className="text-muted text-sm">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted max-w-xs">
                  <span className="line-clamp-2">{signal.content}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                  {new Date(signal.detectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">No signals match your filters.</div>
        )}
      </div>
    </div>
  )
}
