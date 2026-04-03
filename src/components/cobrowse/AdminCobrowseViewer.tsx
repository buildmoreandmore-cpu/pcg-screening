'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createEventsChannel, createControlChannel } from '@/lib/cobrowse-channel'

export default function AdminCobrowseViewer({ sessionId }: { sessionId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const replayerRef = useRef<any>(null)
  const [connected, setConnected] = useState(false)
  const [controlActive, setControlActive] = useState(false)
  const [connectionLost, setConnectionLost] = useState(false)
  const lastHeartbeatRef = useRef<number>(Date.now())

  const endSession = useCallback(async () => {
    await fetch(`/api/cobrowse/session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end' }),
    }).catch(() => {})
    window.close()
  }, [sessionId])

  const requestControl = useCallback(async () => {
    const controlChannel = createControlChannel(sessionId)
    controlChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        controlChannel.send({
          type: 'broadcast',
          event: 'control-cmd',
          payload: { type: 'request_control' },
        })
      }
    })

    await fetch(`/api/cobrowse/session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enable_control' }),
    })
    setControlActive(true)
  }, [sessionId])

  useEffect(() => {
    if (!containerRef.current) return

    const eventsChannel = createEventsChannel(sessionId)
    const controlChannel = createControlChannel(sessionId)
    let replayer: any = null

    async function init() {
      // Use rrweb's Replayer directly (avoids Svelte dependency of rrweb-player)
      const rrweb = await import('rrweb')
      const { Replayer: RRwebReplayer } = rrweb

      // Notify portal that admin has accepted
      eventsChannel.send({
        type: 'broadcast',
        event: 'session-accepted',
        payload: {},
      })

      eventsChannel.on('broadcast', { event: 'rrweb-events' }, ({ payload }) => {
        const events = payload?.events || []
        if (!replayer && events.length > 0 && containerRef.current) {
          // Create replayer with first batch in live mode
          try {
            replayer = new RRwebReplayer(events, {
              root: containerRef.current,
              liveMode: true,
            } as any)
            replayer.startLive()
            replayerRef.current = replayer
            setConnected(true)
          } catch {
            // Fallback: just accumulate events
          }
        } else if (replayer) {
          events.forEach((event: any) => {
            try {
              replayer.addEvent(event)
            } catch {
              // Skip malformed events
            }
          })
        }
      })

      eventsChannel.on('broadcast', { event: 'heartbeat' }, () => {
        lastHeartbeatRef.current = Date.now()
        setConnectionLost(false)
      })

      // Listen for control revocation
      controlChannel.on('broadcast', { event: 'control-cmd' }, ({ payload }) => {
        if (payload?.type === 'revoke_control') {
          setControlActive(false)
        }
      })

      eventsChannel.subscribe()
      controlChannel.subscribe()
    }

    init()

    // Check for heartbeat loss
    const heartbeatCheck = setInterval(() => {
      if (connected && Date.now() - lastHeartbeatRef.current > 20000) {
        setConnectionLost(true)
      }
    }, 5000)

    return () => {
      eventsChannel.unsubscribe()
      controlChannel.unsubscribe()
      clearInterval(heartbeatCheck)
    }
  }, [sessionId, connected])

  // Handle admin clicks when control is active
  function handleViewerClick(e: React.MouseEvent) {
    if (!controlActive) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const controlChannel = createControlChannel(sessionId)
    controlChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        controlChannel.send({
          type: 'broadcast',
          event: 'control-cmd',
          payload: { type: 'click', x, y },
        })
      }
    })
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${connectionLost ? 'bg-red-400' : connected ? 'bg-green-400 animate-ping' : 'bg-yellow-400 animate-ping'}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connectionLost ? 'bg-red-400' : connected ? 'bg-green-400' : 'bg-yellow-400'}`} />
          </span>
          <span className="text-sm font-medium text-gray-700">
            {connectionLost ? 'Connection lost' : connected ? 'Live — viewing user screen' : 'Connecting...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!controlActive ? (
            <button
              onClick={requestControl}
              disabled={!connected}
              className="px-3 py-1.5 bg-gold/10 text-gold text-xs font-medium rounded-lg hover:bg-gold/20 transition-colors disabled:opacity-50"
            >
              Request Control
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
              Control Active
            </span>
          )}
          <button
            onClick={endSession}
            className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-auto p-4">
        <div
          ref={containerRef}
          onClick={handleViewerClick}
          className={`mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${controlActive ? 'cursor-pointer' : ''}`}
          style={{ width: 800, minHeight: 600 }}
        />
        {!connected && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <svg className="w-8 h-8 text-gray-300 mx-auto mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-400">Waiting for screen data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
