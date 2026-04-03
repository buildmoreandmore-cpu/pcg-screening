'use client'

import { useState, useEffect } from 'react'

interface Session {
  id: string
  status: string
  client_user: { name: string; email: string } | null
  client: { name: string } | null
  created_at: string
}

export default function AdminCobrowseButton({ clientId }: { clientId?: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/cobrowse/session')
      if (!res.ok) return
      const { sessions: all } = await res.json()
      setSessions(clientId ? all.filter((s: Session) => s.client?.name) : all)
    }
    load()
    const interval = setInterval(load, 15000) // Poll every 15s
    return () => clearInterval(interval)
  }, [clientId])

  const pending = sessions.filter(s => s.status === 'pending')

  if (pending.length === 0) return null

  async function acceptSession(sessionId: string) {
    await fetch(`/api/cobrowse/session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept' }),
    })

    // Open viewer in new window for simplicity
    window.open(`/admin/cobrowse/${sessionId}`, '_blank', 'width=1200,height=800')
    setShowPanel(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        {pending.length} Help Request{pending.length !== 1 ? 's' : ''}
      </button>

      {showPanel && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-navy">Pending Help Requests</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {pending.map((s) => (
              <div key={s.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.client_user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{s.client?.name}</p>
                  </div>
                  <button
                    onClick={() => acceptSession(s.id)}
                    className="px-3 py-1 bg-navy text-white text-xs font-medium rounded-lg hover:bg-navy-light transition-colors"
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
