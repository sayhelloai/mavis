'use client'

import { cn } from '@/lib/utils'

interface SendingDomain {
  domain: string
  dkim: boolean
  spf: boolean
  dmarc: boolean
  warmupStatus: string
  dailyLimit: number
  sentToday: number
}

const mockDomains: SendingDomain[] = [
  { domain: 'outreach.acme.com', dkim: true, spf: true, dmarc: true, warmupStatus: 'WARMED', dailyLimit: 500, sentToday: 142 },
  { domain: 'mail.acme.com', dkim: true, spf: true, dmarc: false, warmupStatus: 'WARMING', dailyLimit: 200, sentToday: 67 },
  { domain: 'sales.acme.com', dkim: false, spf: true, dmarc: false, warmupStatus: 'NEW', dailyLimit: 50, sentToday: 0 },
]

interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  remedy: string
}

const mockAlerts: Alert[] = [
  { id: '1', severity: 'warning', message: 'mail.acme.com is missing DMARC record', remedy: 'Add _dmarc TXT record to DNS: v=DMARC1; p=quarantine; rua=mailto:dmarc@acme.com' },
  { id: '2', severity: 'warning', message: 'sales.acme.com is missing DKIM record', remedy: 'Generate DKIM keys in your DNS provider and add TXT record' },
  { id: '3', severity: 'info', message: 'Bounce rate trending up 0.3% over last 7 days', remedy: 'Review recent hard bounces and remove invalid emails from sequences' },
]

const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
}

function HealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#EAB308' : '#EF4444'
  const pct = score / 100
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = pct * circ * 0.75 // 270deg arc

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="rotate-[135deg]" width="128" height="128" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#1E3A5F" strokeWidth="10" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white" style={{ color }}>{score}</span>
          <span className="text-xs text-muted">/100</span>
        </div>
      </div>
      <p className="text-sm font-medium mt-2" style={{ color }}>
        {score >= 80 ? 'Healthy' : score >= 60 ? 'At Risk' : 'Critical'}
      </p>
    </div>
  )
}

const providerData = [
  { provider: 'Gmail', inboxRate: 96.2, spamRate: 2.1, missingRate: 1.7 },
  { provider: 'Outlook', inboxRate: 93.8, spamRate: 3.4, missingRate: 2.8 },
  { provider: 'Yahoo', inboxRate: 89.1, spamRate: 6.2, missingRate: 4.7 },
]

const bounceData = [
  { date: 'Mar 1', rate: 1.2 }, { date: 'Mar 5', rate: 1.4 }, { date: 'Mar 8', rate: 1.1 },
  { date: 'Mar 12', rate: 1.6 }, { date: 'Mar 15', rate: 1.8 }, { date: 'Mar 19', rate: 1.9 },
]

export function DeliverabilityPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Deliverability</h1>
        <p className="text-muted text-sm mt-1">Email health and sending domain status</p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center">
          <HealthGauge score={87} />
          <p className="text-xs text-muted mt-2">Overall health score</p>
        </div>

        {[
          { label: 'Avg Inbox Rate', value: '93.0%', color: 'text-green-400', sub: 'Across all providers' },
          { label: 'Bounce Rate', value: '1.9%', color: 'text-yellow-400', sub: '↑ 0.3% this week', warning: true },
          { label: 'Spam Complaint Rate', value: '0.08%', color: 'text-green-400', sub: 'Below 0.1% threshold' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className={`text-xs mt-2 ${stat.warning ? 'text-yellow-400' : 'text-muted'}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Provider breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Provider Inbox Placement</h3>
          <div className="space-y-3">
            {providerData.map(p => (
              <div key={p.provider}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">{p.provider}</span>
                  <span className={p.inboxRate >= 93 ? 'text-green-400' : p.inboxRate >= 85 ? 'text-yellow-400' : 'text-red-400'}>
                    {p.inboxRate}% inbox
                  </span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500" style={{ width: `${p.inboxRate}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${p.spamRate}%` }} />
                </div>
                <div className="flex gap-3 text-xs text-muted mt-1">
                  <span>Inbox: {p.inboxRate}%</span>
                  <span>Spam: {p.spamRate}%</span>
                  <span>Missing: {p.missingRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bounce rate chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Bounce Rate (30 days)</h3>
          <div className="relative h-32">
            {/* Simple SVG line chart */}
            <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(y => (
                <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#1E3A5F" strokeWidth="0.5" />
              ))}
              {/* Threshold line at 2% */}
              <line x1="0" y1="50" x2="300" y2="50" stroke="#EF4444" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
              {/* Bounce rate line */}
              <polyline
                fill="none"
                stroke="#EAB308"
                strokeWidth="2"
                points={bounceData.map((d, i) => {
                  const x = (i / (bounceData.length - 1)) * 300
                  const y = 100 - (d.rate / 4) * 100
                  return `${x},${y}`
                }).join(' ')}
              />
              {bounceData.map((d, i) => {
                const x = (i / (bounceData.length - 1)) * 300
                const y = 100 - (d.rate / 4) * 100
                return <circle key={i} cx={x} cy={y} r="3" fill="#EAB308" />
              })}
            </svg>
          </div>
          <div className="flex justify-between text-xs text-muted mt-2">
            {bounceData.map(d => <span key={d.date}>{d.date}</span>)}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-yellow-500"/><span className="text-muted">Bounce rate</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-500 opacity-50" style={{ borderTop: '1px dashed' }}/><span className="text-muted">2% threshold</span></div>
          </div>
        </div>
      </div>

      {/* Sending domains */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-white">Sending Domains</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Domain</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">DKIM</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">SPF</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">DMARC</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Warmup</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Usage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockDomains.map(domain => (
              <tr key={domain.domain} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-3 text-sm font-mono text-white">{domain.domain}</td>
                {[domain.dkim, domain.spf, domain.dmarc].map((ok, i) => (
                  <td key={i} className="px-5 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                      {ok ? '✓ Valid' : '✗ Missing'}
                    </span>
                  </td>
                ))}
                <td className="px-5 py-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    domain.warmupStatus === 'WARMED' ? 'bg-green-500/20 text-green-400' :
                    domain.warmupStatus === 'WARMING' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  )}>
                    {domain.warmupStatus}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${(domain.sentToday / domain.dailyLimit) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted">{domain.sentToday}/{domain.dailyLimit}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active alerts */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Active Alerts</h3>
        <div className="space-y-2">
          {mockAlerts.map(alert => {
            const colors = SEVERITY_COLORS[alert.severity]
            return (
              <div key={alert.id} className={cn('border rounded-xl p-4', colors.bg, colors.border)}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', colors.dot)} />
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium', colors.text)}>{alert.message}</p>
                    <p className="text-xs text-muted mt-1">{alert.remedy}</p>
                  </div>
                  <span className={cn('text-xs uppercase font-medium', colors.text)}>{alert.severity}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
