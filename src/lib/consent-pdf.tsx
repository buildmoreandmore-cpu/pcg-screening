import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer'
import { renderToBuffer } from '@react-pdf/renderer'
import { createAdminClient } from '@/lib/supabase-admin'
import { FCRA_DISCLOSURE_HISTORY } from '@/lib/fcra-disclosure'

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' },
  ],
})

const NAVY = '#1f2f4a'
const GOLD = '#c9a44c'
const GRAY = '#4a4743'
const LIGHT_GRAY = '#8a8680'
const BG_GRAY = '#f8f7f4'

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: GRAY },
  title: { fontSize: 18, fontWeight: 'bold', color: NAVY, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 10, color: LIGHT_GRAY, textAlign: 'center', marginBottom: 16 },
  divider: { height: 2, backgroundColor: GOLD, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: NAVY, marginBottom: 8, marginTop: 16 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 6, minHeight: 24 },
  colLabel: { width: '30%', fontSize: 9, color: LIGHT_GRAY },
  colValue: { width: '70%', fontSize: 10, color: NAVY },
  paragraph: { fontSize: 9, lineHeight: 1.5, color: GRAY, marginBottom: 8 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 7, color: LIGHT_GRAY },
  auditBox: { backgroundColor: BG_GRAY, borderRadius: 6, padding: 12, marginBottom: 12 },
  auditRow: { flexDirection: 'row', marginBottom: 4 },
  auditLabel: { width: '30%', fontSize: 8, color: LIGHT_GRAY },
  auditValue: { width: '70%', fontSize: 9, color: GRAY },
  checkbox: { fontSize: 9, color: GRAY, marginBottom: 4 },
})

interface ConsentPdfProps {
  candidate: {
    first_name: string
    last_name: string
    email: string
    tracking_code: string
    consent_signed_at: string | null
    consent_ip: string | null
    consent_user_agent: string | null
    consent_method: string | null
    consent_signature_data_url: string | null
    consent_disclosure_version: string | null
  }
  clientName: string
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pcgscreening.net').replace(/\/+$/, '')
}

function ConsentRecordDocument({ candidate: c, clientName }: ConsentPdfProps) {
  const version = c.consent_disclosure_version || ''
  const snapshot = version ? FCRA_DISCLOSURE_HISTORY[version] : null

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Image src={`${getSiteUrl()}/Copy_of_PCG_Logo_with_Soft_Typography.png`} style={{ width: 120, height: 'auto', alignSelf: 'center', marginBottom: 12 }} />
        <Text style={s.title}>FCRA Disclosure & Authorization Record</Text>
        <Text style={s.subtitle}>Consent Document — Confidential</Text>
        <View style={s.divider} />

        {/* Candidate Info */}
        <View style={s.sectionTitle}><Text>Candidate Information</Text></View>
        {[
          ['Name', `${c.first_name} ${c.last_name}`],
          ['Email', c.email],
          ['Tracking Code', c.tracking_code],
          ['Client / Employer', clientName],
        ].map(([label, value]) => (
          <View key={label} style={s.row}>
            <Text style={s.colLabel}>{label}</Text>
            <Text style={s.colValue}>{value}</Text>
          </View>
        ))}

        {/* Audit Trail */}
        <View style={s.sectionTitle}><Text>Consent Audit Trail</Text></View>
        <View style={s.auditBox}>
          {[
            ['Consent Captured At', c.consent_signed_at ? new Date(c.consent_signed_at).toUTCString() : '—'],
            ['Signature Method', c.consent_method || '—'],
            ['IP Address', c.consent_ip || '—'],
            ['Disclosure Version', version || '—'],
            ['User Agent', c.consent_user_agent || '—'],
          ].map(([label, value]) => (
            <View key={label} style={s.auditRow}>
              <Text style={s.auditLabel}>{label}</Text>
              <Text style={s.auditValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* FCRA Disclosure Text */}
        {snapshot && (
          <>
            <View style={s.sectionTitle}><Text>Disclosure & Authorization Text Shown to Candidate</Text></View>
            {snapshot.paragraphs.map((p, i) => (
              <Text key={i} style={s.paragraph}>{p}</Text>
            ))}

            {/* Checkboxes */}
            <View style={{ marginTop: 12 }}>
              <Text style={s.checkbox}>[x] {snapshot.checkbox1}</Text>
              <Text style={s.checkbox}>[x] {snapshot.checkbox2}</Text>
            </View>
          </>
        )}

        {/* Signature */}
        {c.consent_signature_data_url && (
          <>
            <View style={s.sectionTitle}><Text>Electronic Signature</Text></View>
            <View style={{ border: '1px solid #e5e5e5', borderRadius: 4, padding: 8, alignSelf: 'flex-start' }}>
              <Image src={c.consent_signature_data_url} style={{ width: 280, height: 'auto' }} />
            </View>
          </>
        )}

        <View style={s.footer}>
          <Text>PCG Screening Services • 770-716-1278 • accounts@pcgscreening.com • www.pcgscreening.net</Text>
        </View>
      </Page>
    </Document>
  )
}

/**
 * Generate a consent record PDF for a candidate and upload it to Supabase storage.
 * Returns the public URL of the stored PDF, or null on failure.
 */
export async function generateAndStoreConsentPdf(candidateId: string): Promise<string | null> {
  const supabase = createAdminClient()

  const { data: c, error } = await supabase
    .from('candidates')
    .select(
      'id, first_name, last_name, email, tracking_code, consent_signed_at, consent_ip, consent_user_agent, consent_method, consent_signature_data_url, consent_disclosure_version, client:clients(name)'
    )
    .eq('id', candidateId)
    .single()

  if (error || !c) {
    console.error('[consent-pdf] Candidate not found:', candidateId, error)
    return null
  }

  const clientName = (c.client as any)?.name || 'Unknown Client'

  const buffer = await renderToBuffer(
    <ConsentRecordDocument candidate={c} clientName={clientName} />
  )

  const storagePath = `consent/${candidateId}.pdf`
  const pdfBuffer = Buffer.from(buffer)

  // Upsert: remove old file first (ignore errors if it doesn't exist)
  await supabase.storage.from('screening-reports').remove([storagePath])

  const { error: uploadError } = await supabase.storage
    .from('screening-reports')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    console.error('[consent-pdf] Upload failed:', uploadError)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('screening-reports')
    .getPublicUrl(storagePath)

  const publicUrl = urlData?.publicUrl || null

  // Store URL on candidate record
  if (publicUrl) {
    await supabase
      .from('candidates')
      .update({ consent_document_url: publicUrl })
      .eq('id', candidateId)
  }

  return publicUrl
}
