'use client'

import { createClient } from './supabase-browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

const BATCH_INTERVAL = 300 // ms — batch rrweb events to reduce message rate

export function createEventsChannel(sessionId: string): RealtimeChannel {
  const supabase = createClient()
  return supabase.channel(`cobrowse:events:${sessionId}`, {
    config: { broadcast: { self: false } },
  })
}

export function createControlChannel(sessionId: string): RealtimeChannel {
  const supabase = createClient()
  return supabase.channel(`cobrowse:control:${sessionId}`, {
    config: { broadcast: { self: false } },
  })
}

// rrweb event types we can deduplicate in the buffer
const MOUSE_MOVE_SOURCE = 1  // IncrementalSource.MouseMove
const SCROLL_SOURCE = 3      // IncrementalSource.Scroll

/**
 * Compact the buffer: keep only the latest mouse-move and latest scroll
 * per target, drop intermediate positions that the admin will never see.
 */
function compactBuffer(events: any[]): any[] {
  const result: any[] = []
  const seenMouseMove = new Set<string>()
  const seenScroll = new Set<string>()

  // Walk backward so we keep the LAST occurrence
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    const src = e?.data?.source

    if (src === MOUSE_MOVE_SOURCE) {
      const key = 'mouse'
      if (seenMouseMove.has(key)) continue
      seenMouseMove.add(key)
    }
    if (src === SCROLL_SOURCE) {
      const key = `scroll-${e.data?.id ?? 0}`
      if (seenScroll.has(key)) continue
      seenScroll.add(key)
    }
    result.push(e)
  }

  return result.reverse()
}

/**
 * Creates a batched sender that accumulates rrweb events, compacts
 * redundant ones, and flushes at BATCH_INTERVAL.
 */
export function createBatchedSender(channel: RealtimeChannel) {
  let buffer: any[] = []
  let timer: ReturnType<typeof setInterval> | null = null

  function flush() {
    if (buffer.length === 0) return
    const batch = compactBuffer(buffer)
    buffer = []
    channel.send({
      type: 'broadcast',
      event: 'rrweb-events',
      payload: { events: batch },
    })
  }

  function start() {
    timer = setInterval(flush, BATCH_INTERVAL)
  }

  function addEvent(event: any) {
    buffer.push(event)
  }

  function stop() {
    if (timer) clearInterval(timer)
    flush() // send remaining
  }

  return { start, addEvent, stop }
}

export type ControlCommand =
  | { type: 'click'; x: number; y: number }
  | { type: 'navigate'; path: string }
  | { type: 'request_control' }
  | { type: 'revoke_control' }
  | { type: 'heartbeat' }
