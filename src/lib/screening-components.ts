// Canonical list of screening components, mirrored from
// src/components/screening/ScreeningSelector.tsx TABS. This is the
// vocabulary used by client_packages.components jsonb.

export const SCREENING_COMPONENTS = [
  { key: 'criminal_history', label: 'Criminal History', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { key: 'sex_offender', label: 'Sex Offender Registry', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { key: 'international_search', label: 'International Search', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'driver_history', label: 'Driver / MVR', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10' },
  // Sanctions split into 4 individual audit-ready checks (per Elevait feedback):
  { key: 'ofac', label: 'OFAC (Patriot Act)', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { key: 'oig_leie', label: 'OIG / LEIE Exclusion', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { key: 'sam', label: 'SAM (System for Award Management)', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { key: 'gsa', label: 'GSA Excluded Parties', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { key: 'social_security_trace', label: 'SSN Trace', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0' },
  { key: 'education', label: 'Education Verification', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { key: 'employment', label: 'Employment Verification', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'professional_license', label: 'Professional License', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { key: 'references', label: 'References', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'civil_checks', label: 'Civil Records', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
  { key: 'credit_reports', label: 'Credit Report', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { key: 'e_verify', label: 'E-Verify', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'drug_screen', label: 'Drug Screen', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
] as const

export type ScreeningComponentKey = typeof SCREENING_COMPONENTS[number]['key']

// Drug panel options offered when `drug_screen` is enabled on a package.
export const DRUG_PANEL_OPTIONS = [
  { value: '4_panel_no_thc', label: '4-Panel (NO THC)' },
  { value: '4_panel', label: '4-Panel (with THC)' },
  { value: '5_panel_no_thc', label: '5-Panel (NO THC)' },
  { value: '5_panel', label: '5-Panel (with THC)' },
  { value: '9_panel_no_thc', label: '9-Panel (NO THC)' },
  { value: '9_panel', label: '9-Panel (with THC)' },
  { value: '10_panel_no_thc', label: '10-Panel (NO THC)' },
  { value: '10_panel', label: '10-Panel (with THC)' },
] as const

export type DrugPanelKey = typeof DRUG_PANEL_OPTIONS[number]['value']

export function drugPanelLabel(value: string | null | undefined): string {
  if (!value) return ''
  return DRUG_PANEL_OPTIONS.find((p) => p.value === value)?.label || value
}

// Legacy `sanctions_lists` data still exists on older candidates. Map it
// to the new individual checks so reports stay readable. If the legacy
// key is enabled but new individual keys aren't set, expand to ofac+oig.
const SANCTIONS_LEGACY_KEYS = ['ofac', 'oig_leie'] as const

/**
 * Convert a candidate's `screening_components` JSON into a flat list of
 * active component keys, expanding the legacy `sanctions_lists` parent
 * into its individual sub-checks.
 */
export function expandActiveComponents(
  components: Record<string, unknown> | null | undefined
): string[] {
  if (!components) return []
  const active = new Set<string>()

  for (const [key, val] of Object.entries(components)) {
    const isEnabled =
      val === true ||
      (typeof val === 'object' && val !== null && 'enabled' in val && (val as { enabled: boolean }).enabled)

    if (!isEnabled) continue

    if (key === 'sanctions_lists') {
      // Expand legacy sanctions parent into individual checks
      const sub = val as Record<string, unknown>
      const explicitOfac = sub.ofac === true
      const explicitOig = sub.healthcare_oig === true || sub.oig_leie === true
      const explicitSam = sub.sam === true
      const explicitGsa = sub.gsa === true

      if (explicitOfac) active.add('ofac')
      if (explicitOig) active.add('oig_leie')
      if (explicitSam) active.add('sam')
      if (explicitGsa) active.add('gsa')

      // If sanctions_lists.enabled is true but no individual subflags set,
      // default to OFAC + OIG (the original two-checkbox legacy behavior).
      if (!explicitOfac && !explicitOig && !explicitSam && !explicitGsa) {
        SANCTIONS_LEGACY_KEYS.forEach((k) => active.add(k))
      }
    } else {
      active.add(key)
    }
  }

  return Array.from(active)
}

export function countComponents(components: Record<string, boolean> | null | undefined): number {
  if (!components) return 0
  return Object.values(components).filter(Boolean).length
}

/**
 * Normalize any shape of `candidates.screening_components` JSONB into the
 * full nested ScreeningSelections shape that ScreeningSelector and
 * ScreeningSummary expect. Handles three input shapes:
 *
 *   1. Legacy nested: { criminal_history: { enabled: true, ... }, ... }
 *   2. New flat:      { criminal_history: true, ofac: true, ... }
 *   3. Post-migration mixed: { criminal_history: { enabled: true },
 *                              ofac: { enabled: true },
 *                              oig_leie: { enabled: true } }
 *
 * Output always has every top-level key. Flat ofac/oig_leie/sam/gsa keys
 * are folded back into sanctions_lists.{ofac, healthcare_oig, sam, gsa}.
 */
export function normalizeScreeningComponents(
  raw: Record<string, unknown> | null | undefined
): Record<string, any> {
  // Default skeleton — every top-level key present, all disabled.
  const out: Record<string, any> = {
    criminal_history: { enabled: false, statewide: false, statewide_states: [], county: false, county_jurisdictions: [], national_with_sex_offender: false, federal: false },
    sex_offender: { enabled: false, states: [] },
    international_search: { enabled: false, international_criminal: false, cities: '', countries: '', federal: false, felony_misdemeanor: false },
    driver_history: { enabled: false, state: '', license_number: '' },
    sanctions_lists: { enabled: false, ofac: false, healthcare_oig: false, sam: false, gsa: false },
    social_security_trace: { enabled: false },
    education: { enabled: false, school_name: '', year_graduated: '', location: '' },
    employment: { enabled: false, employer_contacts: '' },
    professional_license: { enabled: false, state: '', license_type: '' },
    references: { enabled: false, contacts: '' },
    civil_checks: { enabled: false, bankruptcy: false, county_civil_record: false, statewide_eviction: [], civil_record_county_state: '' },
    credit_reports: { enabled: false },
    e_verify: { enabled: false },
    drug_screen: { enabled: false },
  }

  if (!raw) return out

  const isEnabled = (val: unknown): boolean =>
    val === true ||
    (typeof val === 'object' && val !== null && 'enabled' in val && (val as { enabled: boolean }).enabled === true)

  for (const [key, val] of Object.entries(raw)) {
    // Flat-key sanctions sub-checks fold back into sanctions_lists.
    if (key === 'ofac' && isEnabled(val)) {
      out.sanctions_lists.enabled = true
      out.sanctions_lists.ofac = true
      continue
    }
    if (key === 'oig_leie' && isEnabled(val)) {
      out.sanctions_lists.enabled = true
      out.sanctions_lists.healthcare_oig = true
      continue
    }
    if (key === 'sam' && isEnabled(val)) {
      out.sanctions_lists.enabled = true
      out.sanctions_lists.sam = true
      continue
    }
    if (key === 'gsa' && isEnabled(val)) {
      out.sanctions_lists.enabled = true
      out.sanctions_lists.gsa = true
      continue
    }

    // Skip keys we don't model in ScreeningSelections.
    if (!(key in out)) continue

    // Boolean flat shape: { criminal_history: true }
    if (val === true) {
      out[key] = { ...out[key], enabled: true }
      continue
    }
    if (val === false) {
      out[key] = { ...out[key], enabled: false }
      continue
    }

    // Nested object shape: merge over the default skeleton.
    if (typeof val === 'object' && val !== null) {
      out[key] = { ...out[key], ...(val as Record<string, unknown>) }
    }
  }

  return out
}
