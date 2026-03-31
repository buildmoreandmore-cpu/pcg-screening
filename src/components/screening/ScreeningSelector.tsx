'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ScreeningSelectorProps, ScreeningSelections } from './screening-types'
import { DEFAULT_SELECTIONS } from './screening-types'
import ScreeningSection, { SubOption, ScreeningInput } from './ScreeningSection'
import StatePicker from './StatePicker'
import JurisdictionPicker from './JurisdictionPicker'

export default function ScreeningSelector({ mode: initialMode, initialSelections, onChange, onEdit }: ScreeningSelectorProps) {
  const [mode, setMode] = useState(initialMode)
  const [selections, setSelections] = useState<ScreeningSelections>(() => {
    if (initialSelections) return { ...DEFAULT_SELECTIONS, ...initialSelections }
    return { ...DEFAULT_SELECTIONS }
  })

  const isView = mode === 'view'
  const isEdit = mode === 'edit'

  const update = useCallback((patch: Partial<ScreeningSelections>) => {
    setSelections(prev => {
      const next = { ...prev, ...patch }
      onChange?.(next)
      return next
    })
  }, [onChange])

  function updateSection<K extends keyof ScreeningSelections>(key: K, patch: Partial<ScreeningSelections[K]>) {
    update({ [key]: { ...selections[key], ...patch } } as any)
  }

  const enabledCount = Object.values(selections).filter((s: any) => s.enabled).length

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base text-navy">
            {isView ? 'Screening Components' : 'Select Screening Components'}
          </h3>
          {isEdit && (
            <p className="text-xs text-gray-500 mt-0.5">{enabledCount} component{enabledCount !== 1 ? 's' : ''} selected</p>
          )}
        </div>
        {isView && onEdit && (
          <button
            type="button"
            onClick={() => { setMode('edit'); onEdit() }}
            className="text-sm text-gold hover:text-gold-light font-medium transition-colors"
          >
            Edit Selections
          </button>
        )}
      </div>

      {/* 1. Criminal History */}
      <ScreeningSection
        title="Criminal History Search"
        description="National, statewide, county, and federal criminal records"
        enabled={selections.criminal_history.enabled}
        onToggle={v => updateSection('criminal_history', { enabled: v })}
        mode={mode}
      >
        <SubOption
          label="Statewide Criminal Check"
          checked={selections.criminal_history.statewide}
          onChange={v => updateSection('criminal_history', { statewide: v })}
          disabled={isView}
          note="Some states are not available. Contact PCG for details."
        >
          <StatePicker
            selected={selections.criminal_history.statewide_states || []}
            onChange={states => updateSection('criminal_history', { statewide_states: states })}
            disabled={isView}
            placeholder="Select states..."
          />
        </SubOption>

        <SubOption
          label="County Criminal Check"
          checked={selections.criminal_history.county}
          onChange={v => updateSection('criminal_history', { county: v })}
          disabled={isView}
        >
          <JurisdictionPicker
            selected={selections.criminal_history.county_jurisdictions || []}
            onChange={j => updateSection('criminal_history', { county_jurisdictions: j })}
            disabled={isView}
          />
        </SubOption>

        <SubOption
          label="National Criminal Check w/ Sex Offender Registry"
          checked={selections.criminal_history.national_with_sex_offender}
          onChange={v => updateSection('criminal_history', { national_with_sex_offender: v })}
          disabled={isView}
          note="Includes national database + sex offender registry"
        />

        <SubOption
          label="Federal Criminal Check"
          checked={selections.criminal_history.federal}
          onChange={v => updateSection('criminal_history', { federal: v })}
          disabled={isView}
        />
      </ScreeningSection>

      {/* 2. Sex Offender Registry */}
      <ScreeningSection
        title="Sex Offender Registry Search"
        description="State-level sex offender registry searches"
        enabled={selections.sex_offender.enabled}
        onToggle={v => updateSection('sex_offender', { enabled: v })}
        mode={mode}
      >
        <p className="text-xs text-gray-500 mb-2">Select the states to search</p>
        <StatePicker
          selected={selections.sex_offender.states || []}
          onChange={states => updateSection('sex_offender', { states })}
          disabled={isView}
          placeholder="Select states..."
        />
      </ScreeningSection>

      {/* 3. International Search */}
      <ScreeningSection
        title="International Search"
        description="International criminal records and checks"
        enabled={selections.international_search.enabled}
        onToggle={v => updateSection('international_search', { enabled: v })}
        mode={mode}
      >
        <SubOption
          label="International Criminal Check"
          checked={selections.international_search.international_criminal}
          onChange={v => updateSection('international_search', { international_criminal: v })}
          disabled={isView}
        >
          <ScreeningInput
            label="Cities"
            value={selections.international_search.cities || ''}
            onChange={v => updateSection('international_search', { cities: v })}
            placeholder="e.g. London, Toronto"
            disabled={isView}
          />
          <ScreeningInput
            label="Countries"
            value={selections.international_search.countries || ''}
            onChange={v => updateSection('international_search', { countries: v })}
            placeholder="e.g. United Kingdom, Canada"
            disabled={isView}
          />
        </SubOption>

        <SubOption
          label="Federal"
          checked={selections.international_search.federal}
          onChange={v => updateSection('international_search', { federal: v })}
          disabled={isView}
        />

        <SubOption
          label="Felony / Misdemeanor"
          checked={selections.international_search.felony_misdemeanor}
          onChange={v => updateSection('international_search', { felony_misdemeanor: v })}
          disabled={isView}
        />
      </ScreeningSection>

      {/* 4. Driver History */}
      <ScreeningSection
        title="Driver History / MVR"
        description="Motor vehicle records and driving history"
        enabled={selections.driver_history.enabled}
        onToggle={v => updateSection('driver_history', { enabled: v })}
        mode={mode}
      >
        <p className="text-xs text-amber-600 mb-2">Please note that California cannot be checked.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">State</label>
            <StatePicker
              selected={selections.driver_history.state ? [selections.driver_history.state] : []}
              onChange={states => updateSection('driver_history', { state: states[0] || '' })}
              multi={false}
              disabled={isView}
              placeholder="Select state..."
            />
          </div>
          <ScreeningInput
            label="License Number"
            value={selections.driver_history.license_number || ''}
            onChange={v => updateSection('driver_history', { license_number: v })}
            placeholder="Enter license number"
            disabled={isView}
          />
        </div>
      </ScreeningSection>

      {/* 5. Sanctions Lists */}
      <ScreeningSection
        title="Sanctions List Search"
        description="OFAC and healthcare exclusion list searches"
        enabled={selections.sanctions_lists.enabled}
        onToggle={v => updateSection('sanctions_lists', { enabled: v })}
        mode={mode}
      >
        <SubOption
          label="OFAC (Patriot Act)"
          checked={selections.sanctions_lists.ofac}
          onChange={v => updateSection('sanctions_lists', { ofac: v })}
          disabled={isView}
        />
        <SubOption
          label="Healthcare Sanction (OIG List)"
          checked={selections.sanctions_lists.healthcare_oig}
          onChange={v => updateSection('sanctions_lists', { healthcare_oig: v })}
          disabled={isView}
        />
      </ScreeningSection>

      {/* 6. Social Security Trace */}
      <ScreeningSection
        title="Social Security Trace"
        description="SSN verification and address history"
        enabled={selections.social_security_trace.enabled}
        onToggle={v => updateSection('social_security_trace', { enabled: v })}
        mode={mode}
      >
        <p className="text-xs text-gray-500">SSN trace will be included in this screening.</p>
      </ScreeningSection>

      {/* 7. Education Verification */}
      <ScreeningSection
        title="Education Verification"
        description="Verify degrees and enrollment"
        enabled={selections.education.enabled}
        onToggle={v => updateSection('education', { enabled: v })}
        mode={mode}
      >
        <div className="space-y-2">
          <ScreeningInput
            label="School Name"
            value={selections.education.school_name || ''}
            onChange={v => updateSection('education', { school_name: v })}
            placeholder="e.g. Georgia State University"
            disabled={isView}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ScreeningInput
              label="Year Graduated"
              value={selections.education.year_graduated || ''}
              onChange={v => updateSection('education', { year_graduated: v })}
              placeholder="e.g. 2020"
              disabled={isView}
            />
            <ScreeningInput
              label="Location"
              value={selections.education.location || ''}
              onChange={v => updateSection('education', { location: v })}
              placeholder="e.g. Atlanta, GA"
              disabled={isView}
            />
          </div>
        </div>
      </ScreeningSection>

      {/* 8. Employment Verification */}
      <ScreeningSection
        title="Employment Verification"
        description="Verify past employment history"
        enabled={selections.employment.enabled}
        onToggle={v => updateSection('employment', { enabled: v })}
        mode={mode}
      >
        <ScreeningInput
          label="Employer Contact(s)"
          value={selections.employment.employer_contacts || ''}
          onChange={v => updateSection('employment', { employer_contacts: v })}
          placeholder="Employer name, location, and phone number"
          disabled={isView}
          type="textarea"
        />
        {isEdit && (
          <p className="text-xs text-gray-400 mt-1">
            Enter contact information for each employer you need checked. Include employer name, location, and phone number.
          </p>
        )}
      </ScreeningSection>

      {/* 9. Professional License */}
      <ScreeningSection
        title="Professional License Verification"
        description="Verify professional licenses and certifications"
        enabled={selections.professional_license.enabled}
        onToggle={v => updateSection('professional_license', { enabled: v })}
        mode={mode}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">State</label>
            <StatePicker
              selected={selections.professional_license.state ? [selections.professional_license.state] : []}
              onChange={states => updateSection('professional_license', { state: states[0] || '' })}
              multi={false}
              disabled={isView}
              placeholder="Select state..."
            />
          </div>
          <ScreeningInput
            label="License Type"
            value={selections.professional_license.license_type || ''}
            onChange={v => updateSection('professional_license', { license_type: v })}
            placeholder="e.g. RN, CPA, PE"
            disabled={isView}
          />
        </div>
      </ScreeningSection>

      {/* 10. References */}
      <ScreeningSection
        title="Reference Check"
        description="Contact and verify professional references"
        enabled={selections.references.enabled}
        onToggle={v => updateSection('references', { enabled: v })}
        mode={mode}
      >
        <ScreeningInput
          label="Reference Contact(s) Information"
          value={selections.references.contacts || ''}
          onChange={v => updateSection('references', { contacts: v })}
          placeholder="Name(s), phone number(s), etc."
          disabled={isView}
          type="textarea"
        />
      </ScreeningSection>

      {/* 11. Civil Checks */}
      <ScreeningSection
        title="Civil Records Search"
        description="Bankruptcy, county civil, and eviction searches"
        enabled={selections.civil_checks.enabled}
        onToggle={v => updateSection('civil_checks', { enabled: v })}
        mode={mode}
      >
        <SubOption
          label="Bankruptcy Check"
          checked={selections.civil_checks.bankruptcy}
          onChange={v => updateSection('civil_checks', { bankruptcy: v })}
          disabled={isView}
        />
        <SubOption
          label="County Civil Record"
          checked={selections.civil_checks.county_civil_record}
          onChange={v => updateSection('civil_checks', { county_civil_record: v })}
          disabled={isView}
        />

        <div className="mt-3">
          <p className="text-sm text-gray-700 mb-1.5">Statewide Eviction Check(s)</p>
          <StatePicker
            selected={selections.civil_checks.statewide_eviction || []}
            onChange={states => updateSection('civil_checks', { statewide_eviction: states })}
            disabled={isView}
            placeholder="Select states for eviction search..."
          />
        </div>

        <ScreeningInput
          label="Civil Record County / State"
          value={selections.civil_checks.civil_record_county_state || ''}
          onChange={v => updateSection('civil_checks', { civil_record_county_state: v })}
          placeholder="e.g. Fulton / GA (one per line)"
          disabled={isView}
          type="textarea"
        />
        {isEdit && (
          <p className="text-xs text-gray-400 mt-1">Please enter county and state pairs, one per line.</p>
        )}
      </ScreeningSection>

      {/* 12. Credit Reports */}
      <ScreeningSection
        title="Credit Check"
        description="Consumer credit report"
        enabled={selections.credit_reports.enabled}
        onToggle={v => updateSection('credit_reports', { enabled: v })}
        mode={mode}
      >
        <p className="text-xs text-gray-500">A credit check will be included in this screening.</p>
      </ScreeningSection>

      {/* 13. E-Verify */}
      <ScreeningSection
        title="E-Verify"
        description="Employment eligibility verification"
        enabled={selections.e_verify.enabled}
        onToggle={v => updateSection('e_verify', { enabled: v })}
        mode={mode}
      >
        <p className="text-xs text-gray-500">Include E-Verify as part of this request.</p>
      </ScreeningSection>
    </div>
  )
}
