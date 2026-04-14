import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer'
import { renderToBuffer } from '@react-pdf/renderer'
import { createAdminClient } from '@/lib/supabase-admin'
import { SCREENING_COMPONENTS } from '@/lib/screening-components'
import { FCRA_DISCLOSURE_PARAGRAPHS, FCRA_DISCLOSURE_VERSION } from '@/lib/fcra-disclosure'
import type { ScreeningResults, ResultVerdict, ReportAttachment } from '@/lib/report-types'
import { VERDICT_LABELS, VERDICT_COLORS } from '@/lib/report-types'

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
  logo: { width: 120, height: 'auto', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: NAVY, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 10, color: LIGHT_GRAY, textAlign: 'center', marginBottom: 16 },
  divider: { height: 2, backgroundColor: GOLD, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: NAVY, marginBottom: 8, marginTop: 16 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 6, minHeight: 24 },
  headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: NAVY, paddingBottom: 4, marginBottom: 2 },
  colLabel: { width: '30%', fontSize: 9, color: LIGHT_GRAY },
  colValue: { width: '70%', fontSize: 10, color: NAVY },
  resultCol1: { width: '30%', fontSize: 10 },
  resultCol2: { width: '20%', fontSize: 10 },
  resultCol3: { width: '50%', fontSize: 9, color: GRAY },
  headerText: { fontSize: 9, fontWeight: 'bold', color: NAVY },
  summaryBox: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: BG_GRAY, borderRadius: 6, padding: 12, marginVertical: 12 },
  summaryItem: { alignItems: 'center' },
  summaryCount: { fontSize: 20, fontWeight: 'bold' },
  summaryLabel: { fontSize: 8, color: LIGHT_GRAY, marginTop: 2 },
  paragraph: { fontSize: 9, lineHeight: 1.5, color: GRAY, marginBottom: 8 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 7, color: LIGHT_GRAY },
  badge: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
})

interface ReportProps {
  candidate: {
    first_name: string
    last_name: string
    dob: string | null
    tracking_code: string
    address: string | null
    ssn_last4: string | null
    email: string
    phone: string | null
    sex: string | null
    race: string | null
    drivers_license_number: string | null
    drivers_license_state: string | null
    maiden_name: string | null
  }
  clientName: string
  packageName: string
  screeningResults: ScreeningResults
  activeComponents: string[]
  jurisdictions: Array<{ type: string; name: string; state?: string }>
  additionalDetails: Record<string, unknown>
  attachmentNames: string[]
  preparedBy: string
  generatedAt: string
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pcgscreening.net').replace(/\/+$/, '')
}

function ScreeningReportDocument(props: ReportProps) {
  const {
    candidate: c, clientName, packageName, screeningResults,
    activeComponents, jurisdictions, additionalDetails,
    attachmentNames, preparedBy, generatedAt,
  } = props

  const results = activeComponents.map(key => ({
    key,
    label: SCREENING_COMPONENTS.find(sc => sc.key === key)?.label || key,
    ...(screeningResults[key] || { result: 'not_applicable' as ResultVerdict, details: '' }),
  }))

  const counts = {
    clear: results.filter(r => r.result === 'clear').length,
    record_found: results.filter(r => r.result === 'record_found').length,
    adverse: results.filter(r => r.result === 'adverse').length,
  }

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* Logo & Title */}
        <Image src={`${getSiteUrl()}/Copy_of_PCG_Logo_with_Soft_Typography.png`} style={s.logo} />
        <Text style={s.title}>Background Screening Report</Text>
        <Text style={s.subtitle}>Confidential — For Authorized Use Only</Text>
        <View style={s.divider} />

        {/* Candidate Metadata */}
        <View style={s.sectionTitle}><Text>Report Details</Text></View>
        {[
          ['Candidate Name', `${c.first_name} ${c.last_name}${c.maiden_name ? ` (aka ${c.maiden_name})` : ''}`],
          ['Date of Birth', c.dob ? new Date(c.dob + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'],
          ['SSN', c.ssn_last4 ? `XXX-XX-${c.ssn_last4}` : '—'],
          ['Address', c.address || '—'],
          ['Tracking Code', c.tracking_code],
          ['Client / Employer', clientName],
          ['Package', packageName],
          ['Report Date', generatedAt],
          ['Prepared By', preparedBy],
        ].map(([label, value]) => (
          <View key={label} style={s.row}>
            <Text style={s.colLabel}>{label}</Text>
            <Text style={s.colValue}>{value}</Text>
          </View>
        ))}

        {/* Summary */}
        <View style={s.summaryBox}>
          <View style={s.summaryItem}>
            <Text style={[s.summaryCount, { color: VERDICT_COLORS.clear }]}>{counts.clear}</Text>
            <Text style={s.summaryLabel}>Clear</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryCount, { color: VERDICT_COLORS.record_found }]}>{counts.record_found}</Text>
            <Text style={s.summaryLabel}>Record Found</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryCount, { color: VERDICT_COLORS.adverse }]}>{counts.adverse}</Text>
            <Text style={s.summaryLabel}>Adverse</Text>
          </View>
        </View>

        {/* Results Table */}
        <View style={s.sectionTitle}><Text>Screening Results</Text></View>
        <View style={s.headerRow}>
          <Text style={[s.resultCol1, s.headerText]}>Component</Text>
          <Text style={[s.resultCol2, s.headerText]}>Result</Text>
          <Text style={[s.resultCol3, s.headerText]}>Details</Text>
        </View>
        {results.map(r => (
          <View key={r.key} style={s.row} wrap={false}>
            <Text style={s.resultCol1}>{r.label}</Text>
            <Text style={[s.resultCol2, { color: VERDICT_COLORS[r.result] }]}>{VERDICT_LABELS[r.result]}</Text>
            <Text style={s.resultCol3}>{r.details || '—'}</Text>
          </View>
        ))}

        {/* Jurisdictions */}
        {jurisdictions.length > 0 && (
          <>
            <View style={s.sectionTitle}><Text>Search Jurisdictions</Text></View>
            {jurisdictions.map((j, i) => (
              <View key={i} style={s.row}>
                <Text style={s.colLabel}>{j.type}</Text>
                <Text style={s.colValue}>{j.name}{j.state ? `, ${j.state}` : ''}</Text>
              </View>
            ))}
          </>
        )}

        {/* Additional Details */}
        {Object.keys(additionalDetails).length > 0 && (
          <>
            <View style={s.sectionTitle}><Text>Additional Information</Text></View>
            {additionalDetails.education && (() => {
              const edu = additionalDetails.education as Record<string, string>
              return (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: NAVY, marginBottom: 2 }}>Education</Text>
                  <Text style={s.paragraph}>
                    {edu.school}{edu.degree ? ` — ${edu.degree}` : ''}{edu.graduated === 'yes' && edu.graduationYear ? ` (Graduated ${edu.graduationYear})` : edu.graduated === 'no' ? ' (Did not graduate)' : ''}
                  </Text>
                </View>
              )
            })()}
            {additionalDetails.employment && (() => {
              const emp = additionalDetails.employment as Record<string, string>
              return (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: NAVY, marginBottom: 2 }}>Employment</Text>
                  <Text style={s.paragraph}>
                    {emp.employer}{emp.title ? ` — ${emp.title}` : ''}{emp.from ? ` (${emp.from}${emp.to ? ` to ${emp.to}` : ' to present'})` : ''}
                  </Text>
                </View>
              )
            })()}
            {additionalDetails.professionalLicense && (() => {
              const lic = additionalDetails.professionalLicense as Record<string, string>
              return (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: NAVY, marginBottom: 2 }}>Professional License</Text>
                  <Text style={s.paragraph}>
                    {lic.type} #{lic.number}{lic.state ? ` (${lic.state})` : ''}{lic.expiration ? ` — Exp: ${lic.expiration}` : ''}
                  </Text>
                </View>
              )
            })()}
            {additionalDetails.internationalCountries && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: NAVY, marginBottom: 2 }}>International Search</Text>
                <Text style={s.paragraph}>Countries: {String(additionalDetails.internationalCountries)}</Text>
              </View>
            )}
          </>
        )}

        {/* Attachments note */}
        {attachmentNames.length > 0 && (
          <>
            <View style={s.sectionTitle}><Text>Supplementary Documents Attached</Text></View>
            {attachmentNames.map((name, i) => (
              <Text key={i} style={[s.paragraph, { paddingLeft: 8 }]}>• {name}</Text>
            ))}
          </>
        )}

        <View style={s.footer}>
          <Text>PCG Screening Services • 770-716-1278 • accounts@pcgscreening.com • www.pcgscreening.net</Text>
        </View>
      </Page>

      {/* FCRA Disclosure Page */}
      <Page size="LETTER" style={s.page}>
        <View style={s.sectionTitle}><Text>FCRA Disclosure & Authorization</Text></View>
        <View style={s.divider} />
        {FCRA_DISCLOSURE_PARAGRAPHS.map((p, i) => (
          <Text key={i} style={s.paragraph}>{p}</Text>
        ))}
        <Text style={[s.paragraph, { fontStyle: 'italic', marginTop: 12 }]}>
          Disclosure version: {FCRA_DISCLOSURE_VERSION}
        </Text>
        <View style={s.footer}>
          <Text>PCG Screening Services • 770-716-1278 • accounts@pcgscreening.com • www.pcgscreening.net</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateReportPdf(candidateId: string): Promise<Buffer> {
  const supabase = createAdminClient()

  const { data: c, error } = await supabase
    .from('candidates')
    .select('*, client:clients(id, name, slug, contact_email, notification_email)')
    .eq('id', candidateId)
    .single()

  if (error || !c) throw new Error(`Candidate not found: ${candidateId}`)

  const screeningResults: ScreeningResults = c.screening_results || {}
  const attachments: ReportAttachment[] = c.report_attachments || []
  const jurisdictions = c.search_jurisdictions || []
  const additionalDetails = c.additional_details || {}

  // Determine active components from screening_components or package components
  const components = c.screening_components || {}
  const activeComponents: string[] = []
  for (const [key, val] of Object.entries(components)) {
    if (typeof val === 'object' && val !== null && 'enabled' in val && (val as { enabled: boolean }).enabled) {
      activeComponents.push(key)
    } else if (val === true) {
      activeComponents.push(key)
    }
  }

  // If no screening_components set, derive from results keys
  if (activeComponents.length === 0 && Object.keys(screeningResults).length > 0) {
    activeComponents.push(...Object.keys(screeningResults))
  }

  const { data: admin } = await supabase
    .from('admin_users')
    .select('name')
    .eq('active', true)
    .limit(1)
    .single()

  const props: ReportProps = {
    candidate: c,
    clientName: c.client?.name || 'Unknown Client',
    packageName: c.package_name || 'Standard',
    screeningResults,
    activeComponents,
    jurisdictions,
    additionalDetails,
    attachmentNames: attachments.map(a => a.name),
    preparedBy: admin?.name || 'PCG Screening Services',
    generatedAt: new Date().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    }),
  }

  const buffer = await renderToBuffer(<ScreeningReportDocument {...props} />)
  return Buffer.from(buffer)
}
