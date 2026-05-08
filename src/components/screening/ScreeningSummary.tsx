'use client'

import { useState } from 'react'
import type { ScreeningSelections } from './screening-types'

interface ScreeningSummaryProps {
  selections: ScreeningSelections
  onViewDetails?: () => void
}

function getSummaryChips(s: ScreeningSelections): string[] {
  const chips: string[] = []

  // Optional chaining guards every section — if a candidate's screening_components
  // JSONB is missing keys (post-migration data), we render the chips that ARE
  // populated and silently skip the missing sections instead of crashing.
  if (s.criminal_history?.enabled) {
    const parts: string[] = []
    if (s.criminal_history.statewide) parts.push('Statewide')
    if (s.criminal_history.county) parts.push('County')
    if (s.criminal_history.national_with_sex_offender) parts.push('National')
    if (s.criminal_history.federal) parts.push('Federal')
    chips.push(parts.length ? `Criminal (${parts.join(' + ')})` : 'Criminal History')
  }

  if (s.sex_offender?.enabled) chips.push('Sex Offender Registry')
  if (s.international_search?.enabled) chips.push('International Search')
  if (s.driver_history?.enabled) chips.push('Driver History / MVR')
  if (s.sanctions_lists?.enabled) {
    const parts: string[] = []
    if (s.sanctions_lists.ofac) parts.push('OFAC')
    if (s.sanctions_lists.healthcare_oig) parts.push('OIG')
    if (s.sanctions_lists.sam) parts.push('SAM')
    if (s.sanctions_lists.gsa) parts.push('GSA')
    chips.push(parts.length ? `Sanctions (${parts.join(' + ')})` : 'Sanctions Lists')
  }
  if (s.social_security_trace?.enabled) chips.push('SSN Trace')
  if (s.education?.enabled) chips.push('Education')
  if (s.employment?.enabled) chips.push('Employment')
  if (s.professional_license?.enabled) chips.push('Professional License')
  if (s.references?.enabled) chips.push('References')
  if (s.civil_checks?.enabled) {
    const parts: string[] = []
    if (s.civil_checks.bankruptcy) parts.push('Bankruptcy')
    if (s.civil_checks.county_civil_record) parts.push('County Civil')
    if (s.civil_checks.statewide_eviction?.length) parts.push('Eviction')
    chips.push(parts.length ? `Civil (${parts.join(' + ')})` : 'Civil Checks')
  }
  if (s.credit_reports?.enabled) chips.push('Credit Check')
  if (s.e_verify?.enabled) chips.push('E-Verify')
  if (s.drug_screen?.enabled) {
    const panel = s.drug_screen.panel
    chips.push(panel ? `Drug Screen (${panel.replace(/_/g, ' ')})` : 'Drug Screen')
  }

  return chips
}

export default function ScreeningSummary({ selections, onViewDetails }: ScreeningSummaryProps) {
  const chips = getSummaryChips(selections)

  if (chips.length === 0) {
    return <p className="text-sm text-gray-400">No screening components selected</p>
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map(chip => (
          <span key={chip} className="px-2.5 py-1 bg-navy/5 text-navy text-xs rounded-full font-medium">
            {chip}
          </span>
        ))}
      </div>
      {onViewDetails && (
        <button
          type="button"
          onClick={onViewDetails}
          className="text-xs text-gold hover:text-gold-light mt-2 font-medium transition-colors"
        >
          View Details
        </button>
      )}
    </div>
  )
}
