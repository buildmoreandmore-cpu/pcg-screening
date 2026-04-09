import { createHmac } from 'node:crypto'

export type AgentEventType =
  | 'candidate.submitted'
  | 'candidate.status_changed'
  | 'screening.completed'
  | 'screening.flagged'
  | 'client.created'
  | 'payment.received'
  | 'payment.failed'

export interface AgentEventPayload {
  event_type: AgentEventType
  summary: string
  detail: Record<string, unknown>
  timestamp: string
}

/**
 * Fire-and-forget webhook dispatch to the external AI agent.
 * Signs the body with HMAC-SHA256 using PCG_AGENT_WEBHOOK_SECRET.
 * Silently logs and swallows errors — must not block the caller.
 */
export function dispatchAgentEvent(
  eventType: AgentEventType,
  summary: string,
  detail: Record<string, unknown>
): void {
  const url = (process.env.PCG_AGENT_WEBHOOK_URL || '').trim()
  const secret = (process.env.PCG_AGENT_WEBHOOK_SECRET || '').trim()

  if (!url || !secret) {
    // Not configured — silently skip.
    return
  }

  const payload: AgentEventPayload = {
    event_type: eventType,
    summary,
    detail,
    timestamp: new Date().toISOString(),
  }

  const body = JSON.stringify(payload)
  const signature = createHmac('sha256', secret).update(body).digest('hex')

  // Fire and forget. We intentionally do NOT await.
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PCG-Signature': signature,
      'X-PCG-Event-Type': eventType,
    },
    body,
  })
    .then((res) => {
      if (!res.ok) {
        console.error(
          `[agent-webhook] ${eventType} dispatch failed: ${res.status} ${res.statusText}`
        )
      }
    })
    .catch((err) => {
      console.error(`[agent-webhook] ${eventType} dispatch error:`, err)
    })
}
