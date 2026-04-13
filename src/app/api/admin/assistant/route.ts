import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { loadMessagesForClaude, saveMessage } from '@/lib/agent-messages'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL = 'claude-sonnet-4-5-20250929'
const THREAD_ID = 'pcg-admin'

type Role = 'user' | 'assistant'
interface ClientMessage {
  role: Role
  content: string
}

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'get_stats',
    description:
      'Aggregate counts across all PCG candidates: total, submitted, in_progress, completed, sla_flagged, new_today, new_this_week.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'list_candidates',
    description:
      'List candidates across ALL clients, most recent first. Optional filters by status, client name, or sla_flagged. Returns at most 25 candidates.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['submitted', 'in_progress', 'completed', 'cancelled'],
        },
        client_name: { type: 'string', description: 'Partial client name to filter by.' },
        sla_flagged_only: { type: 'boolean' },
        limit: { type: 'integer', minimum: 1, maximum: 25 },
      },
      required: [],
    },
  },
  {
    name: 'get_candidate',
    description: 'Fetch full details for a candidate by id or by tracking code.',
    input_schema: {
      type: 'object',
      properties: {
        candidate_id: { type: 'string' },
        tracking_code: { type: 'string' },
      },
      required: [],
    },
  },
  {
    name: 'list_clients',
    description: 'List employer clients with candidate counts. Returns at most 25.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Partial company name match.' },
        limit: { type: 'integer', minimum: 1, maximum: 25 },
      },
      required: [],
    },
  },
  {
    name: 'get_recent_activity',
    description: 'Recent submissions and status changes across all clients.',
    input_schema: {
      type: 'object',
      properties: {
        days: { type: 'integer', minimum: 1, maximum: 30 },
      },
      required: [],
    },
  },
]

async function runTool(name: string, input: Record<string, unknown>) {
  const supabase = createAdminClient()

  if (name === 'get_stats') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const head = { count: 'exact' as const, head: true }

    const [total, submitted, inProgress, completed, slaFlagged, newToday, newWeek] = await Promise.all([
      supabase.from('candidates').select('id', head),
      supabase.from('candidates').select('id', head).eq('status', 'submitted'),
      supabase.from('candidates').select('id', head).eq('status', 'in_progress'),
      supabase.from('candidates').select('id', head).eq('status', 'completed'),
      supabase.from('candidates').select('id', head).eq('sla_flagged', true),
      supabase.from('candidates').select('id', head).gte('created_at', today.toISOString()),
      supabase.from('candidates').select('id', head).gte('created_at', weekAgo.toISOString()),
    ])

    return {
      total: total.count ?? 0,
      submitted: submitted.count ?? 0,
      in_progress: inProgress.count ?? 0,
      completed: completed.count ?? 0,
      sla_flagged: slaFlagged.count ?? 0,
      new_today: newToday.count ?? 0,
      new_this_week: newWeek.count ?? 0,
    }
  }

  if (name === 'list_candidates') {
    const status = input.status as string | undefined
    const clientName = input.client_name as string | undefined
    const slaOnly = input.sla_flagged_only === true
    const limit = Math.min(Number(input.limit ?? 10), 25)

    let q = supabase
      .from('candidates')
      .select(
        'id, tracking_code, first_name, last_name, email, package_name, status, payment_status, sla_flagged, created_at, client:clients(id, name)'
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) q = q.eq('status', status)
    if (slaOnly) q = q.eq('sla_flagged', true)

    const { data, error } = await q
    if (error) return { error: error.message }

    let rows = data ?? []
    if (clientName) {
      const needle = clientName.toLowerCase()
      rows = rows.filter((c: any) => c.client?.name?.toLowerCase().includes(needle))
    }
    return { candidates: rows, count: rows.length }
  }

  if (name === 'get_candidate') {
    const id = input.candidate_id ? String(input.candidate_id) : null
    const code = input.tracking_code ? String(input.tracking_code) : null
    if (!id && !code) return { error: 'candidate_id or tracking_code required' }

    let q = supabase.from('candidates').select('*, client:clients(id, name)')
    q = id ? q.eq('id', id) : q.eq('tracking_code', code!)
    const { data, error } = await q.maybeSingle()
    if (error) return { error: error.message }
    if (!data) return { error: 'Not found' }
    return { candidate: data }
  }

  if (name === 'list_clients') {
    const search = input.search as string | undefined
    const limit = Math.min(Number(input.limit ?? 10), 25)

    let q = supabase
      .from('clients')
      .select('id, name, slug, billing_type, active, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (search) q = q.ilike('name', `%${search}%`)

    const { data, error } = await q
    if (error) return { error: error.message }
    return { clients: data ?? [], count: data?.length ?? 0 }
  }

  if (name === 'get_recent_activity') {
    const days = Math.min(Math.max(Number(input.days ?? 7), 1), 30)
    const cutoff = new Date(Date.now() - days * 86400 * 1000).toISOString()

    const { data } = await supabase
      .from('candidates')
      .select('id, first_name, last_name, package_name, status, created_at, client:clients(name)')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(50)

    return { days, since: cutoff, recent_submissions: data ?? [] }
  }

  return { error: `Unknown tool: ${name}` }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const incomingMessages: ClientMessage[] = Array.isArray(body.messages) ? body.messages : []
  if (incomingMessages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  // The latest user message is what we need to save + process
  const latestUserMsg = incomingMessages[incomingMessages.length - 1]
  if (latestUserMsg?.role !== 'user') {
    return NextResponse.json({ error: 'last message must be from user' }, { status: 400 })
  }

  // Save the user message to shared conversation
  await saveMessage({
    threadId: THREAD_ID,
    role: 'user',
    content: latestUserMsg.content,
    source: 'admin_panel',
    senderName: admin.name,
  })

  // Load full conversation history from DB (shared between Patrick + Parker)
  const history = await loadMessagesForClaude(THREAD_ID)

  const systemPrompt = `You are Patrick, the PCG Screening admin assistant.
You help PCG staff understand operational state across ALL employer clients: candidate volume, SLA flags, recent activity, and client accounts.

You share a conversation thread with Parker (your Telegram counterpart). Messages from Telegram are marked with the sender's name. You may reference prior context from either interface.

The current user is ${admin.name} (admin panel).

Rules:
- Always call a tool to get live data — never invent numbers, names, or statuses.
- Be concise and direct. Use plain text, short sentences, and bulleted lists when helpful.
- If a question is outside your scope (e.g. legal, HR policy, FCRA interpretation), answer briefly and suggest checking with Gwen or compliance.
- You operate with full admin access — there is no per-client scoping.`

  const anthropic = new Anthropic({ apiKey })

  // Use DB history as conversation context
  const conversation: Anthropic.Messages.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  let finalText = ''
  for (let round = 0; round < 5; round++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages: conversation,
    })

    const textBlocks = response.content.filter(
      (b): b is Anthropic.Messages.TextBlock => b.type === 'text'
    )
    if (textBlocks.length > 0) {
      finalText = textBlocks.map((b) => b.text).join('\n')
    }

    if (response.stop_reason !== 'tool_use') break

    const toolUses = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
    )
    conversation.push({ role: 'assistant', content: response.content })

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
    for (const tu of toolUses) {
      try {
        const result = await runTool(tu.name, (tu.input as Record<string, unknown>) ?? {})
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(result),
        })
      } catch (err: any) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify({ error: err?.message ?? 'tool failed' }),
          is_error: true,
        })
      }
    }
    conversation.push({ role: 'user', content: toolResults })
  }

  // Save assistant reply to shared conversation
  if (finalText) {
    await saveMessage({
      threadId: THREAD_ID,
      role: 'assistant',
      content: finalText,
      source: 'admin_panel',
      senderName: 'Patrick',
    })
  }

  return NextResponse.json({ reply: finalText })
}
