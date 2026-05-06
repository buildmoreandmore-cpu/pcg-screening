import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer'
import { renderToBuffer } from '@react-pdf/renderer'
import { createAdminClient } from '@/lib/supabase-admin'
import { SCREENING_COMPONENTS, expandActiveComponents, drugPanelLabel } from '@/lib/screening-components'
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
  drugPanel: string | null
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
    candidate: c, clientName, packageName, drugPanel, screeningResults,
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
          ...(drugPanel ? [['Drug Panel', drugPanelLabel(drugPanel)] as [string, string]] : []),
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

      {/* FCRA Consumer Rights Summary — Page 1 */}
      <Page size="LETTER" style={s.page}>
        <View style={s.sectionTitle}><Text>A Summary of Your Rights Under the Fair Credit Reporting Act</Text></View>
        <View style={s.divider} />
        <Text style={s.paragraph}>
          The federal Fair Credit Reporting Act (FCRA) promotes the accuracy, fairness, and privacy of information in the files of consumer reporting agencies. There are many types of consumer reporting agencies, including credit bureaus and specialty agencies (such as agencies that sell information about check writing histories, medical records, and rental history records). Here is a summary of your major rights under FCRA. For more information, including information about additional rights, go to www.consumerfinance.gov/learnmore or write to: Consumer Financial Protection Bureau, 1700 G Street N.W., Washington, DC 20552.
        </Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: NAVY }]}>
          You must be told if information in your file has been used against you.
        </Text>
        <Text style={s.paragraph}>
          Anyone who uses a credit report or another type of consumer report to deny your application for credit, insurance, or employment — or to take another adverse action against you — must tell you, and must give you the name, address, and phone number of the agency that provided the information.
        </Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: NAVY }]}>
          You have the right to know what is in your file.
        </Text>
        <Text style={s.paragraph}>
          You may request and obtain all the information about you in the files of a consumer reporting agency (your "file disclosure"). You will be required to provide proper identification, which may include your Social Security number. In many cases, the disclosure will be free. You are entitled to a free file disclosure if: a person has taken adverse action against you because of information in your credit report; you are the victim of identity theft and place a fraud alert in your file; your file contains inaccurate information as a result of fraud; you are on public assistance; or you are unemployed but expect to apply for employment within 60 days.
        </Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: NAVY }]}>
          You have the right to ask for a credit score.
        </Text>
        <Text style={s.paragraph}>
          Credit scores are numerical summaries of your credit-worthiness based on information from credit bureaus. You may request a credit score from consumer reporting agencies that create scores or distribute scores used in residential real property loans, but you will have to pay a fee for it. In some mortgage transactions, you will receive credit score information for free from the mortgage lender.
        </Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: NAVY }]}>
          You have the right to dispute incomplete or inaccurate information.
        </Text>
        <Text style={s.paragraph}>
          If you identify information in your file that is incomplete or inaccurate, and report it to the consumer reporting agency, the agency must investigate unless your dispute is frivolous. See www.consumerfinance.gov/learnmore for an explanation of dispute procedures.
        </Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: NAVY }]}>
          Consumer reporting agencies must correct or delete inaccurate, incomplete, or unverifiable information.
        </Text>
        <Text style={s.paragraph}>
          Inaccurate, incomplete, or unverifiable information must be removed or corrected, usually within 30 days. However, a consumer reporting agency may continue to report information it has verified as accurate.
        </Text>
        <View style={s.footer}>
          <Text>PCG Screening Services • 770-716-1278 • accounts@pcgscreening.com • www.pcgscreening.net</Text>
        </View>
      </Page>

      {/* FCRA Consumer Rights Summary — Page 2 */}
      <Page size="LETTER" style={s.page}>
        <View style={s.sectionTitle}><Text>A Summary of Your Rights Under the Fair Credit Reporting Act (continued)</Text></View>
        <View style={s.divider} />
        <Text style={[s.paragraph, { fontWeight: 'bold', color: NAVY }]}>
          Consumer reporting agencies may not report outdated negative information.
        </Text>
        <Text style={s.paragraph}>
          In most cases, a consumer reporting agency may not report negative information that is more than seven years old, or bankruptcies that are more than 10 years old.
        </Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: NAVY }]}>
          Access to your file is limited.
        </Text>
        <Text style={s.paragraph}>
          A consumer reporting agency may provide information about you only to people with a valid need — usually to consider an application with a creditor, insurer, employer, landlord, or other business. The FCRA specifies those with a valid need for access.
        </Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: NAVY }]}>
          You must give your consent for reports to be provided to employers.
        </Text>
        <Text style={s.paragraph}>
          A consumer reporting agency may not give out information about you to your employer, or a potential employer, without your written consent given to the employer. Written consent generally is not required in the trucking industry. For more information, go to www.consumerfinance.gov/learnmore.
        </Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: NAVY }]}>
          You may limit "prescreened" offers of credit and insurance you get based on information in your credit report.
        </Text>
        <Text style={s.paragraph}>
          Unsolicited "prescreened" offers for credit and insurance must include a toll-free phone number you can call if you choose to remove your name and address from the lists these offers are based on. You may opt out with the nationwide credit bureaus at 1-888-567-8688.
        </Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: NAVY }]}>
          The following FCRA right is especially relevant to identity theft victims.
        </Text>
        <Text style={s.paragraph}>
          You have the right to place a "fraud alert" in your file. You have the right to a free credit report when a fraud alert is placed in your file. You have the right to block information resulting from identity theft. An identity thief's debts may also be blocked from your file. You also have the right to dispute inaccurate information in your file arising from identity theft, and consumer reporting agencies must generally complete their investigation within 30 days.
        </Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: NAVY }]}>
          States may enforce the FCRA, and many states have their own consumer reporting laws.
        </Text>
        <Text style={s.paragraph}>
          You may have additional rights under state law. You may contact a state or local consumer protection agency or state attorney general to learn more. For information about your federal rights, contact the Consumer Financial Protection Bureau at www.consumerfinance.gov/learnmore or (855) 411-2372.
        </Text>
        <Text style={[s.paragraph, { fontStyle: 'italic', marginTop: 12, fontSize: 8, color: LIGHT_GRAY }]}>
          This summary of rights is prescribed by the Consumer Financial Protection Bureau pursuant to Section 609 of the Fair Credit Reporting Act (15 U.S.C. § 1681g).
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

  // Determine active components, expanding sanctions_lists into individual checks.
  const activeComponents = expandActiveComponents(c.screening_components || {})

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
    drugPanel: c.drug_panel || null,
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
