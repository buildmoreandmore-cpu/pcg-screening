'use server'

import { requireAdmin } from '@/lib/admin-auth'
import { generateAndStoreConsentPdf } from '@/lib/consent-pdf'

export async function regenerateConsentPdf({ candidateId }: { candidateId: string }) {
  await requireAdmin()

  const url = await generateAndStoreConsentPdf(candidateId)

  if (!url) {
    return { error: 'Failed to generate consent PDF. Check that the candidate has a signed consent record.' }
  }

  return { ok: true as const, url }
}
