'use client'

import { useCallback, useRef, useState } from 'react'
import { createEventsChannel, createControlChannel, createBatchedSender } from '@/lib/cobrowse-channel'
import type { ControlCommand } from '@/lib/cobrowse-channel'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type SessionState = 'idle' | 'pending' | 'active' | 'ended'

export function useCobrowseSession() {
  const [state, setState] = useState<SessionState>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [controlEnabled, setControlEnabled] = useState(false)
  const [controlRequested, setControlRequested] = useState(false)

  const eventsChannelRef = useRef<RealtimeChannel | null>(null)
  const controlChannelRef = useRef<RealtimeChannel | null>(null)
  const senderRef = useRef<ReturnType<typeof createBatchedSender> | null>(null)
  const stopRecordRef = useRef<(() => void) | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const requestHelp = useCallback(async () => {
    try {
      const res = await fetch('/api/cobrowse/session', { method: 'POST' })
      const { sessionId: id } = await res.json()
      if (!id) return

      setSessionId(id)
      setState('pending')

      // Set up events channel
      const eventsChannel = createEventsChannel(id)
      eventsChannelRef.current = eventsChannel

      const sender = createBatchedSender(eventsChannel)
      senderRef.current = sender

      eventsChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Dynamically import rrweb (client-only)
          const { record } = await import('rrweb')
          const { privacyConfig } = await import('./privacy-config')

          const stop = record({
            emit: (event) => sender.addEvent(event),
            ...privacyConfig,
          } as any)

          stopRecordRef.current = stop || null
          sender.start()
        }
      })

      // Set up control channel (listen for admin commands)
      const controlChannel = createControlChannel(id)
      controlChannelRef.current = controlChannel

      controlChannel.on('broadcast', { event: 'control-cmd' }, ({ payload }) => {
        const cmd = payload as ControlCommand
        if (cmd.type === 'request_control') {
          setControlRequested(true)
        }
        if (cmd.type === 'revoke_control') {
          setControlEnabled(false)
          setControlRequested(false)
        }
        if (cmd.type === 'click') {
          const el = document.elementFromPoint(cmd.x, cmd.y) as HTMLElement | null
          el?.click()
        }
        if (cmd.type === 'navigate') {
          window.location.href = cmd.path
        }
      })

      controlChannel.subscribe()

      // Send heartbeats
      heartbeatRef.current = setInterval(() => {
        eventsChannel.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { ts: Date.now() },
        })
      }, 10000)

      // 5-minute timeout if no admin accepts
      timeoutRef.current = setTimeout(() => {
        if (state === 'pending') endSession()
      }, 5 * 60 * 1000)

      // Listen for admin accepting (status change)
      eventsChannel.on('broadcast', { event: 'session-accepted' }, () => {
        setState('active')
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      })
    } catch {
      setState('idle')
    }
  }, [])

  const endSession = useCallback(async () => {
    if (sessionId) {
      await fetch(`/api/cobrowse/session/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      }).catch(() => {})
    }

    stopRecordRef.current?.()
    senderRef.current?.stop()
    eventsChannelRef.current?.unsubscribe()
    controlChannelRef.current?.unsubscribe()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)

    setState('ended')
    setControlEnabled(false)
    setControlRequested(false)

    // Reset to idle after a moment
    setTimeout(() => setState('idle'), 1000)
  }, [sessionId])

  const allowControl = useCallback(async () => {
    setControlEnabled(true)
    setControlRequested(false)
    if (sessionId) {
      await fetch(`/api/cobrowse/session/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable_control' }),
      }).catch(() => {})
    }
  }, [sessionId])

  const denyControl = useCallback(() => {
    setControlRequested(false)
    controlChannelRef.current?.send({
      type: 'broadcast',
      event: 'control-cmd',
      payload: { type: 'revoke_control' },
    })
  }, [])

  const revokeControl = useCallback(async () => {
    setControlEnabled(false)
    if (sessionId) {
      await fetch(`/api/cobrowse/session/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable_control' }),
      }).catch(() => {})
    }
    controlChannelRef.current?.send({
      type: 'broadcast',
      event: 'control-cmd',
      payload: { type: 'revoke_control' },
    })
  }, [sessionId])

  return {
    state,
    sessionId,
    controlEnabled,
    controlRequested,
    requestHelp,
    endSession,
    allowControl,
    denyControl,
    revokeControl,
  }
}
