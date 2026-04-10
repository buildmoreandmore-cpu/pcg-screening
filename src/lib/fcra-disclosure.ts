/**
 * Versioned FCRA disclosure text shown to candidates during intake.
 *
 * Whenever legal updates the wording, bump FCRA_DISCLOSURE_VERSION and add a
 * new entry to FCRA_DISCLOSURE_HISTORY *without removing the old one*. The
 * admin /admin/candidates/[id]/consent page reads the version stored on the
 * candidate row to render the exact paragraphs that candidate actually saw,
 * even after the live text has moved on.
 */

export const FCRA_DISCLOSURE_VERSION = '2026-04-09'

export const FCRA_DISCLOSURE_PARAGRAPHS: readonly string[] = [
  'In connection with my application for employment or continued employment, I understand that a consumer report and/or investigative consumer report may be requested by the prospective employer or current employer listed above. These reports may include, but are not limited to: criminal history records, court records, driving records, education verification, employment verification, professional references, credit reports, and drug testing results.',
  'I hereby authorize PCG Screening Services and its designated agents to conduct such investigations and to request any and all information deemed necessary. I understand that I have the right to request a complete and accurate disclosure of the nature and scope of the investigation and that I may request a summary of my rights under the Fair Credit Reporting Act (FCRA).',
  'I acknowledge that a telephonic facsimile (fax) or photographic copy of this authorization shall be as valid as the original. This authorization is valid for the duration of my employment or application process.',
]

export const FCRA_CONSENT_CHECKBOX_1 =
  'I have read and understand the above disclosure and authorization statement.'

export const FCRA_CONSENT_CHECKBOX_2 =
  'I authorize PCG Screening Services to conduct the background screening described above.'

export interface FcraDisclosureSnapshot {
  paragraphs: readonly string[]
  checkbox1: string
  checkbox2: string
}

export const FCRA_DISCLOSURE_HISTORY: Record<string, FcraDisclosureSnapshot> = {
  '2026-04-09': {
    paragraphs: FCRA_DISCLOSURE_PARAGRAPHS,
    checkbox1: FCRA_CONSENT_CHECKBOX_1,
    checkbox2: FCRA_CONSENT_CHECKBOX_2,
  },
}
