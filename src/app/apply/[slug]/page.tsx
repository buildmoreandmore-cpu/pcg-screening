import { getSupabase } from '@/lib/supabase'
import CandidateIntake from './CandidateIntake'

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = getSupabase()

  if (!supabase) {
    return <ErrorPage />
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id, slug, name, logo_url, packages, active')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!client) {
    return <ErrorPage />
  }

  return <CandidateIntake client={client} />
}

function ErrorPage() {
  return (
    <div className="min-h-dvh bg-off-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <img src="/Copy_of_PCG_Logo_with_Soft_Typography.png" alt="PCG" className="h-14 mx-auto mb-6" />
        <h1 className="font-heading text-xl text-navy mb-2">This screening link is no longer active.</h1>
        <p className="text-gray-500 text-sm">
          If you believe this is an error, contact PCG Screening Services at{' '}
          <a href="mailto:accounts@pcgscreening.com" className="text-gold">accounts@pcgscreening.com</a>{' '}
          or <a href="tel:7707161278" className="text-gold">770-716-1278</a>.
        </p>
      </div>
    </div>
  )
}
