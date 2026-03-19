interface DealRoomPageProps {
  params: { slug: string }
}

// Mock data — in production this would be fetched server-side by slug
const mockRoom = {
  tenantName: 'Acme Corp',
  prospectName: 'Marcus Webb',
  assets: [
    { id: '1', name: 'Enterprise Security ROI Calculator', fileType: 'pdf', size: '2.3 MB' },
    { id: '2', name: 'Q1 2026 Product Deck', fileType: 'pptx', size: '7.8 MB' },
    { id: '3', name: 'FinCore Case Study', fileType: 'pdf', size: '1.1 MB' },
  ],
  actionItems: [
    { id: '1', label: 'Review security architecture deck', done: false },
    { id: '2', label: 'Schedule technical deep-dive call', done: false },
    { id: '3', label: 'Share procurement requirements', done: true },
  ],
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', pptx: '📊', docx: '📝', mp4: '🎥', default: '📁',
}

export default function DealRoomPage({ params: _params }: DealRoomPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-sidebar">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{mockRoom.tenantName}</p>
              <p className="text-muted text-xs">Deal Room for {mockRoom.prospectName}</p>
            </div>
          </div>
          <a
            href="#book-meeting"
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Book a meeting
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assets */}
          <div className="lg:col-span-2">
            <h2 className="text-white font-semibold mb-4">Shared Resources</h2>
            <div className="space-y-3">
              {mockRoom.assets.map(asset => (
                <div key={asset.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
                  <div className="text-3xl">{FILE_ICONS[asset.fileType] || FILE_ICONS.default}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-muted text-xs">{asset.fileType.toUpperCase()} · {asset.size}</p>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg border border-border text-muted text-xs hover:text-white hover:border-primary/50 transition-colors">
                    View
                  </button>
                </div>
              ))}
            </div>

            {/* Comment box */}
            <div className="mt-8">
              <h2 className="text-white font-semibold mb-4">Leave a question</h2>
              <div className="bg-card border border-border rounded-xl p-4">
                <textarea
                  placeholder="Ask a question or leave feedback..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-3"
                />
                <div className="flex gap-2">
                  <input
                    placeholder="Your email"
                    type="email"
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">Send</button>
                </div>
              </div>
            </div>
          </div>

          {/* Mutual action plan + CTA */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Mutual Action Plan</h3>
              <div className="space-y-3">
                {mockRoom.actionItems.map(item => (
                  <div key={item.id} className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center ${item.done ? 'bg-green-500 border-green-500' : 'border-border'}`}>
                      {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <p className={`text-sm ${item.done ? 'text-muted line-through' : 'text-white'}`}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="book-meeting" className="bg-primary/10 border border-primary/30 rounded-xl p-5 text-center">
              <p className="text-white font-semibold mb-1">Ready to move forward?</p>
              <p className="text-muted text-sm mb-4">Book a 30-minute call with our team</p>
              <a
                href="#"
                className="block w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Book a Meeting →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
