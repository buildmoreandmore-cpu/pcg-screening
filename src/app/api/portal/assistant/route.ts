import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL = 'claude-sonnet-4-5-20250929'

type Role = 'user' | 'assistant'
interface ClientMessage {
  role: Role
  content: string
}

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'get_stats',
    description:
      'Return aggregate counts of candidates for the signed-in employer (scoped to their company, and to themselves if they are a regular user rather than an admin).',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_candidates',
    description:
      "List this employer's candidates, most recent first. Use this when the user asks about who has been screened, recent invites, status of candidates, etc. Returns at most 25 candidates.",
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['submitted', 'in_progress', 'completed', 'cancelled'],
          description: 'Optional status filter.',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 25,
          description: 'Max rows to return. Default 10.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_candidate',
    description:
      'Fetch details for a single candidate by id. Only returns candidates that belong to the signed-in employer.',
    input_schema: {
      type: 'object',
      properties: {
        candidate_id: { type: 'string', description: 'UUID of the candidate.' },
      },
      required: ['candidate_id'],
    },
  },
  {
    name: 'get_recent_activity',
    description:
      'Get a chronological feed of recent candidate submissions and status changes for this employer.',
    input_schema: {
      type: 'object',
      properties: {
        days: {
          type: 'integer',
          minimum: 1,
          maximum: 30,
          description: 'Lookback window in days. Default 7.',
        },
      },
      required: [],
    },
  },
]

interface ScopedContext {
  clientId: string
  clientName: string
  userId: string
  userName: string
  role: string
  scopeByUser: boolean
}

async function runTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ScopedContext
) {
  const supabase = createAdminClient()

  if (name === 'get_stats') {
    const head = { count: 'exact' as const, head: true }
    const base = () =>
      supabase
        .from('candidates')
        .select('id', head)
        .eq('client_id', ctx.clientId)
    const scoped = (q: ReturnType<typeof base>) =>
      ctx.scopeByUser ? q.eq('submitted_by_user_id', ctx.userId) : q

    const [total, submitted, inProgress, completed] = await Promise.all([
      scoped(base()),
      scoped(base()).eq('status', 'submitted'),
      scoped(base()).eq('status', 'in_progress'),
      scoped(base()).eq('status', 'completed'),
    ])

    return {
      client: ctx.clientName,
      scope: ctx.scopeByUser ? 'your own candidates' : 'all company candidates',
      total: total.count ?? 0,
      submitted: submitted.count ?? 0,
      in_progress: inProgress.count ?? 0,
      completed: completed.count ?? 0,
    }
  }

  if (name === 'list_candidates') {
    const status = input.status as string | undefined
    const limit = Math.min(Number(input.limit ?? 10), 25)

    let q = supabase
      .from('candidates')
      .select(
        'id, tracking_code, first_name, last_name, email, package_name, status, payment_status, consent_status, sla_flagged, created_at, screening_started_at, screening_completed_at'
      )
      .eq('client_id', ctx.clientId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (ctx.scopeByUser) q = q.eq('submitted_by_user_id', ctx.userId)
    if (status) q = q.eq('status', status)

    const { data, error } = await q
    if (error) return { error: error.message }
    return { candidates: data ?? [], count: data?.length ?? 0 }
  }

  if (name === 'get_candidate') {
    const id = String(input.candidate_id ?? '')
    let q = supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .eq('client_id', ctx.clientId)
      .maybeSingle()

    // Note: .eq chains before .maybeSingle — scopeByUser enforced below
    const { data, error } = await q
    if (error) return { error: error.message }
    if (!data) return { error: 'Not found or not accessible' }
    if (ctx.scopeByUser && data.submitted_by_user_id !== ctx.userId) {
      return { error: 'Not accessible' }
    }
    return { candidate: data }
  }

  if (name === 'get_recent_activity') {
    const days = Math.min(Math.max(Number(input.days ?? 7), 1), 30)
    const cutoff = new Date(Date.now() - days * 86400 * 1000).toISOString()

    let submissionsQ = supabase
      .from('candidates')
      .select('id, first_name, last_name, package_name, status, created_at')
      .eq('client_id', ctx.clientId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(50)
    if (ctx.scopeByUser) submissionsQ = submissionsQ.eq('submitted_by_user_id', ctx.userId)

    const { data } = await submissionsQ
    return {
      days,
      since: cutoff,
      recent_submissions: data ?? [],
    }
  }

  return { error: `Unknown tool: ${name}` }
}

export async function POST(req: NextRequest) {
  const clientUser = await requireAuth()

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const messages: ClientMessage[] = Array.isArray(body.messages) ? body.messages : []
  if (messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  const ctx: ScopedContext = {
    clientId: clientUser.client_id,
    clientName: clientUser.client?.name ?? 'your company',
    userId: clientUser.id,
    userName: clientUser.name,
    role: clientUser.role,
    scopeByUser: clientUser.role !== 'admin',
  }

  const systemPrompt = `You are the PCG Screening in-portal assistant for ${ctx.userName} at ${ctx.clientName}.
You help employer users understand the status of their background screenings, navigate the portal, and answer questions about PCG Screening services.

Data scoping rules (enforced by tools — you cannot bypass them):
- The signed-in user is "${ctx.userName}" with role "${ctx.role}".
- ${ctx.scopeByUser
  ? "This user is a regular user, so they only see candidates THEY personally submitted."
  : "This user is a company admin, so they see ALL candidates for their company."}
- They never see candidates from other employer companies.

When answering questions about candidates, counts, or status, ALWAYS call a tool to get live data — never make up numbers. Be concise. Use plain language. If asked something outside the scope of this portal, answer briefly and redirect to support@pcgscreening.com.`

  const anthropic = new Anthropic({ apiKey })

  const conversation: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  // Agentic loop — up to 5 tool-use rounds.
  let finalText = ''
  for (let round = 0; round < 5; round++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages: conversation,
    })

    // Collect any text blocks
    const textBlocks = response.content.filter(
      (b): b is Anthropic.Messages.TextBlock => b.type === 'text'
    )
    if (textBlocks.length > 0) {
      finalText = textBlocks.map((b) => b.text).join('\n')
    }

    if (response.stop_reason !== 'tool_use') break

    // Execute tool calls
    const toolUses = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
    )

    conversation.push({ role: 'assistant', content: response.content })

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
    for (const tu of toolUses) {
      try {
        const result = await runTool(
          tu.name,
          (tu.input as Record<string, unknown>) ?? {},
          ctx
        )
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

  return NextResponse.json({ reply: finalText })
}
