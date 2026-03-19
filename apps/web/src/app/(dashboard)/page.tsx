import { auth } from '@/auth'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-muted mt-1 text-sm">Welcome back, {session?.user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Prospect Budget Widget */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Prospect Budget</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">120</span>
            <span className="text-muted text-sm mb-1">/ 500</span>
          </div>
          <div className="mt-3 h-1.5 bg-background rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: '24%' }} />
          </div>
          <p className="text-xs text-muted mt-2">24% used this month</p>
        </div>

        {/* Review Queue */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Review Queue</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">3</span>
            <span className="text-muted text-sm mb-1">pending</span>
          </div>
          <p className="text-xs text-muted mt-4">Sequences awaiting approval</p>
        </div>

        {/* Active Sequences */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Active Sequences</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">47</span>
            <span className="text-muted text-sm mb-1">/ 750</span>
          </div>
          <p className="text-xs text-muted mt-4">Growth plan cap</p>
        </div>

        {/* Hot Leads */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Hot Leads</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-accent">2</span>
            <span className="text-muted text-sm mb-1">this week</span>
          </div>
          <p className="text-xs text-muted mt-4">Meetings booked</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { text: 'New signal detected: DataVault Corp Series B announcement', time: '2m ago', type: 'signal' },
            { text: 'Sequence approved for Marcus Webb (DataVault Corp)', time: '15m ago', type: 'sequence' },
            { text: 'Sarah Chen (FinCore) replied positively — moved to Lead', time: '1h ago', type: 'lead' },
            { text: 'Monthly budget reset: 500 prospects available', time: '2d ago', type: 'system' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                item.type === 'signal' ? 'bg-accent' :
                item.type === 'lead' ? 'bg-green-400' :
                item.type === 'sequence' ? 'bg-primary' : 'bg-muted'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-white">{item.text}</p>
                <p className="text-muted text-xs mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
