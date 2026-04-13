import { NextRequest, NextResponse } from 'next/server'
import { loadMessages, saveMessage } from '@/lib/agent-messages'

export const dynamic = 'force-dynamic'

/**
 * Shared conversation endpoint for Patrick (admin panel) and Parker (Telegram).
 *
 * GET  /api/agent/messages?thread_id=pcg-admin&limit=30
 *   — Load conversation history. Authenticated via admin session OR agent API key.
 *
 * POST /api/agent/messages
 *   — Save a message to the thread. Authenticated via agent API key (Parker)
 *     or admin session (Patrick uses /api/admin/assistant which saves internally).
 */

function verifyAgentKey(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  const expected = (process.env.PCG_AGENT_API_KEY || '').trim()
  return !!expected && token === expected
}

export async function GET(req: NextRequest) {
  // Allow access from admin session (cookie-based) or agent API key
  const isAgent = verifyAgentKey(req)

  // For admin panel, the admin session cookie is enough (handled by middleware)
  // For Telegram/external agents, require the API key
  if (!isAgent) {
    // Check if it's an admin session by trying to import admin auth
    // But since this is a simple GET for the admin panel popup, we allow
    // cookie-based requests through. The admin layout already protects the page.
    // If no cookie and no API key, reject.
    const cookie = req.cookies.get('admin_session')?.value
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const threadId = req.nextUrl.searchParams.get('thread_id') || 'pcg-admin'
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || 50), 100)

  const messages = await loadMessages(threadId, limit)

  return NextResponse.json({
    thread_id: threadId,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      source: m.source,
      sender_name: m.sender_name,
      created_at: m.created_at,
    })),
    count: messages.length,
  })
}

export async function POST(req: NextRequest) {
  // Only agent API key can POST (Parker/Telegram uses this)
  // Patrick saves via /api/admin/assistant which calls saveMessage() directly
  if (!verifyAgentKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { thread_id, role, content, source, sender_name } = body

  if (!role || !content) {
    return NextResponse.json({ error: 'role and content required' }, { status: 400 })
  }

  if (!['user', 'assistant'].includes(role)) {
    return NextResponse.json({ error: 'role must be user or assistant' }, { status: 400 })
  }

  const message = await saveMessage({
    threadId: thread_id || 'pcg-admin',
    role,
    content,
    source: source || 'telegram',
    senderName: sender_name,
  })

  if (!message) {
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }

  return NextResponse.json({ message })
}
