export interface Jurisdiction {
  type: 'county' | 'city'
  name: string
  state: string
}

export interface ScreeningSelections {
  criminal_history: {
    enabled: boolean
    statewide: boolean
    statewide_states?: string[]
    county: boolean
    county_jurisdictions?: Jurisdiction[]
    national_with_sex_offender: boolean
    federal: boolean
  }
  sex_offender: {
    enabled: boolean
    states?: string[]
  }
  international_search: {
    enabled: boolean
    international_criminal: boolean
    cities?: string
    countries?: string
    federal: boolean
    felony_misdemeanor: boolean
  }
  driver_history: {
    enabled: boolean
    state?: string
    license_number?: string
  }
  sanctions_lists: {
    enabled: boolean
    ofac: boolean
    healthcare_oig: boolean
    sam: boolean
    gsa: boolean
  }
  social_security_trace: {
    enabled: boolean
  }
  education: {
    enabled: boolean
    school_name?: string
    year_graduated?: string
    location?: string
  }
  employment: {
    enabled: boolean
    employer_contacts?: string
  }
  professional_license: {
    enabled: boolean
    state?: string
    license_type?: string
  }
  references: {
    enabled: boolean
    contacts?: string
  }
  civil_checks: {
    enabled: boolean
    bankruptcy: boolean
    county_civil_record: boolean
    statewide_eviction?: string[]
    civil_record_county_state?: string
  }
  credit_reports: {
    enabled: boolean
  }
  e_verify: {
    enabled: boolean
  }
}

export interface ScreeningSelectorProps {
  mode: 'edit' | 'view'
  initialSelections?: ScreeningSelections
  onChange?: (selections: ScreeningSelections) => void
  onEdit?: () => void
}

export const DEFAULT_SELECTIONS: ScreeningSelections = {
  criminal_history: {
    enabled: false,
    statewide: false,
    statewide_states: [],
    county: false,
    county_jurisdictions: [],
    national_with_sex_offender: false,
    federal: false,
  },
  sex_offender: { enabled: false, states: [] },
  international_search: {
    enabled: false,
    international_criminal: false,
    cities: '',
    countries: '',
    federal: false,
    felony_misdemeanor: false,
  },
  driver_history: { enabled: false, state: '', license_number: '' },
  sanctions_lists: { enabled: false, ofac: false, healthcare_oig: false, sam: false, gsa: false },
  social_security_trace: { enabled: false },
  education: { enabled: false, school_name: '', year_graduated: '', location: '' },
  employment: { enabled: false, employer_contacts: '' },
  professional_license: { enabled: false, state: '', license_type: '' },
  references: { enabled: false, contacts: '' },
  civil_checks: {
    enabled: false,
    bankruptcy: false,
    county_civil_record: false,
    statewide_eviction: [],
    civil_record_county_state: '',
  },
  credit_reports: { enabled: false },
  e_verify: { enabled: false },
}
