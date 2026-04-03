'use client'

import { createClient } from './supabase-browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

const BATCH_INTERVAL = 100 // ms — batch rrweb events to stay under rate limits

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

/**
 * Creates a batched sender that accumulates rrweb events and flushes
 * them at BATCH_INTERVAL to stay within Supabase rate limits.
 */
export function createBatchedSender(channel: RealtimeChannel) {
  let buffer: any[] = []
  let timer: ReturnType<typeof setInterval> | null = null

  function flush() {
    if (buffer.length === 0) return
    const batch = buffer
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
