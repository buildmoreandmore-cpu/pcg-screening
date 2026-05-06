'use client'

import { useState, useCallback } from 'react'
import type { ScreeningSelectorProps, ScreeningSelections } from './screening-types'
import { DEFAULT_SELECTIONS } from './screening-types'
import { SubOption, ScreeningInput } from './ScreeningSection'
import StatePicker from './StatePicker'
import JurisdictionPicker from './JurisdictionPicker'

const TABS = [
  { key: 'criminal_history', label: 'Criminal', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { key: 'sex_offender', label: 'Sex Offender', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { key: 'international_search', label: 'International', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'driver_history', label: 'Driver / MVR', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10' },
  { key: 'sanctions_lists', label: 'Sanctions', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { key: 'social_security_trace', label: 'SSN Trace', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0' },
  { key: 'education', label: 'Education', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { key: 'employment', label: 'Employment', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'professional_license', label: 'License', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { key: 'references', label: 'References', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'civil_checks', label: 'Civil', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
  { key: 'credit_reports', label: 'Credit', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { key: 'e_verify', label: 'E-Verify', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
] as const

type TabKey = typeof TABS[number]['key']

export default function ScreeningSelector({ mode: initialMode, initialSelections, onChange, onEdit }: ScreeningSelectorProps) {
  const [mode, setMode] = useState(initialMode)
  const [selections, setSelections] = useState<ScreeningSelections>(() => {
    if (initialSelections) return { ...DEFAULT_SELECTIONS, ...initialSelections }
    return { ...DEFAULT_SELECTIONS }
  })
  const [activeTab, setActiveTab] = useState<TabKey>('criminal_history')

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
  const activeSection = selections[activeTab] as any

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Tab bar — wraps to show all */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {TABS.map(tab => {
          const section = selections[tab.key] as any
          const enabled = section?.enabled
          const isActive = activeTab === tab.key

          // In view mode, only show enabled tabs
          if (isView && !enabled) return null

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-navy text-white shadow-sm'
                  : enabled
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
              </svg>
              {tab.label}
              {enabled && !isActive && (
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="mt-3 border border-gray-100 rounded-xl bg-white p-4">
        {/* Toggle for active tab */}
        {isEdit && (
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <button
              type="button"
              role="switch"
              aria-checked={activeSection?.enabled}
              onClick={() => updateSection(activeTab, { enabled: !activeSection?.enabled } as any)}
              className={`relative w-10 h-[22px] rounded-full shrink-0 transition-colors ${activeSection?.enabled ? 'bg-navy' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${activeSection?.enabled ? 'left-[20px]' : 'left-[2px]'}`} />
            </button>
            <span className={`text-sm font-semibold ${activeSection?.enabled ? 'text-navy' : 'text-gray-400'}`}>
              {TABS.find(t => t.key === activeTab)?.label}
            </span>
          </div>
        )}

        {/* Content per tab */}
        <div className={activeSection?.enabled ? '' : 'opacity-40 pointer-events-none'}>
          {activeTab === 'criminal_history' && (
            <div className="space-y-0">
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
            </div>
          )}

          {activeTab === 'sex_offender' && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Select the states to search</p>
              <StatePicker
                selected={selections.sex_offender.states || []}
                onChange={states => updateSection('sex_offender', { states })}
                disabled={isView}
                placeholder="Select states..."
              />
            </div>
          )}

          {activeTab === 'international_search' && (
            <div className="space-y-0">
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
            </div>
          )}

          {activeTab === 'driver_history' && (
            <div>
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
            </div>
          )}

          {activeTab === 'sanctions_lists' && (
            <div className="space-y-0">
              <SubOption
                label="OFAC (Patriot Act)"
                checked={selections.sanctions_lists.ofac}
                onChange={v => updateSection('sanctions_lists', { ofac: v })}
                disabled={isView}
              />
              <SubOption
                label="OIG / LEIE Healthcare Exclusion"
                checked={selections.sanctions_lists.healthcare_oig}
                onChange={v => updateSection('sanctions_lists', { healthcare_oig: v })}
                disabled={isView}
              />
              <SubOption
                label="SAM (System for Award Management)"
                checked={selections.sanctions_lists.sam}
                onChange={v => updateSection('sanctions_lists', { sam: v })}
                disabled={isView}
              />
              <SubOption
                label="GSA Excluded Parties"
                checked={selections.sanctions_lists.gsa}
                onChange={v => updateSection('sanctions_lists', { gsa: v })}
                disabled={isView}
              />
            </div>
          )}

          {activeTab === 'social_security_trace' && (
            <p className="text-xs text-gray-500">SSN trace will be included in this screening.</p>
          )}

          {activeTab === 'education' && (
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
          )}

          {activeTab === 'employment' && (
            <div>
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
            </div>
          )}

          {activeTab === 'professional_license' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
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
              <div>
                <label className="block text-xs text-gray-600 mb-1">License Type</label>
                {isView ? (
                  <p className="text-sm text-gray-900">
                    {selections.professional_license.license_type || <span className="text-gray-400">Not provided</span>}
                  </p>
                ) : (
                  <input
                    type="text"
                    value={selections.professional_license.license_type || ''}
                    onChange={e => updateSection('professional_license', { license_type: e.target.value })}
                    placeholder="e.g. RN, CPA, PE"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'references' && (
            <ScreeningInput
              label="Reference Contact(s) Information"
              value={selections.references.contacts || ''}
              onChange={v => updateSection('references', { contacts: v })}
              placeholder="Name(s), phone number(s), etc."
              disabled={isView}
              type="textarea"
            />
          )}

          {activeTab === 'civil_checks' && (
            <div className="space-y-0">
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
            </div>
          )}

          {activeTab === 'credit_reports' && (
            <p className="text-xs text-gray-500">A credit check will be included in this screening.</p>
          )}

          {activeTab === 'e_verify' && (
            <p className="text-xs text-gray-500">Include E-Verify as part of this request.</p>
          )}
        </div>
      </div>
    </div>
  )
}
