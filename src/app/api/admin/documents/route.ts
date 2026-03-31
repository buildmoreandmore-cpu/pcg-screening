import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json([])

  const { data } = await supabase
    .from('compliance_documents')
    .select('*')
    .order('category')
    .order('name')

  return NextResponse.json(data ?? [])
}
