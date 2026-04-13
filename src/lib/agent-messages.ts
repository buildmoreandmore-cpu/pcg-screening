import { createAdminClient } from './supabase-admin'

const DEFAULT_THREAD = 'pcg-admin'
const MAX_CONTEXT_MESSAGES = 50 // keep last 50 messages for context window

export interface AgentMessage {
  id: string
  thread_id: string
  role: 'user' | 'assistant'
  content: string
  source: string
  sender_name: string | null
  created_at: string
}

/**
 * Load recent conversation history for a thread.
 * Both Patrick (admin panel) and Parker (Telegram) share the same thread_id
 * so conversation context carries across interfaces.
 */
export async function loadMessages(
  threadId: string = DEFAULT_THREAD,
  limit: number = MAX_CONTEXT_MESSAGES
): Promise<AgentMessage[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[agent-messages] loadMessages error:', error.message)
    return []
  }

  // Reverse so oldest is first (chronological order)
  return (data ?? []).reverse()
}

/**
 * Save a message to the shared conversation thread.
 */
export async function saveMessage({
  threadId = DEFAULT_THREAD,
  role,
  content,
  source,
  senderName,
}: {
  threadId?: string
  role: 'user' | 'assistant'
  content: string
  source: 'admin_panel' | 'telegram'
  senderName?: string
}): Promise<AgentMessage | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('agent_messages')
    .insert({
      thread_id: threadId,
      role,
      content,
      source,
      sender_name: senderName || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[agent-messages] saveMessage error:', error.message)
    return null
  }

  return data
}

/**
 * Load messages formatted for the Anthropic API (role + content pairs).
 * Strips metadata — only returns what Claude needs for context.
 */
export async function loadMessagesForClaude(
  threadId: string = DEFAULT_THREAD,
  limit: number = MAX_CONTEXT_MESSAGES
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  const messages = await loadMessages(threadId, limit)
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))
}
