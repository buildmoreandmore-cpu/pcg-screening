'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPECIALTIES = [
  'Emergency Medicine', 'Internal Medicine', 'Family Medicine', 'Anesthesiology',
  'Radiology', 'Psychiatry', 'Pediatrics', 'OB/GYN', 'General Surgery',
  'Orthopedics', 'Cardiology', 'Hospitalist', 'Urgent Care', 'Neurology',
  'Pulmonology', 'Nephrology', 'Gastroenterology', 'Endocrinology',
  'Rheumatology', 'Dermatology', 'Ophthalmology', 'Otolaryngology', 'Urology',
  'Pathology', 'Physical Medicine', 'Pain Management', 'Infectious Disease',
  'Hematology/Oncology', 'Neonatology', 'Critical Care', 'Other',
]

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois',
  'Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts',
  'Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota',
  'Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington',
  'West Virginia','Wisconsin','Wyoming',
]

const DEGREES = ['MD', 'DO', 'DPM', 'DDS', 'DMD', 'PhD', 'Other']

const REQUIRED_DOCS: { key: string; label: string }[] = [
  { key: 'cv_resume', label: 'CV / Resume' },
  { key: 'state_license', label: 'Active State License' },
  { key: 'government_id', label: 'Government ID' },
  { key: 'malpractice_insurance', label: 'Certificate of Malpractice Insurance / COI' },
]

const RECOMMENDED_DOCS: { key: string; label: string }[] = [
  { key: 'w9', label: 'W-9' },
  { key: 'medical_school_diploma', label: 'Medical School Diploma' },
  { key: 'dea_registration', label: 'Federal DEA / Controlled Substance Registration' },
  { key: 'board_certification', label: 'Board Certification' },
  { key: 'bls_acls', label: 'BLS / ACLS / ATLS / PALS Certificate(s)' },
  { key: 'cme_documentation', label: 'CME Documentation (past 2 years)' },
  { key: 'ecfmg', label: 'ECFMG Certificate' },
  { key: 'malpractice_history', label: 'Malpractice / Disciplinary Documentation' },
  { key: 'reference_letters', label: 'Professional Reference Letters' },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type License = {
  state: string
  license_number: string
  active: boolean
  date_granted: string
  expiration_date: string
}

type UploadedDoc = {
  id: string
  document_type: string
  file_name: string
  file_size: number
}

type FormData = {
  first_name: string
  last_name: string
  middle_name: string
  degree: string
  suffix: string
  email: string
  phone: string
  date_of_birth: string
  ssn: string
  citizenship: string
  birthplace: string
  home_address: string
  home_city: string
  home_state: string
  home_zip: string
  showOfficeAddress: boolean
  office_address: string
  office_city: string
  office_state: string
  office_zip: string
  specialty: string
  npi_number: string
  dea_number: string
  dea_expiration: string
  licenses: License[]
  documents: UploadedDoc[]
  certify: boolean
}

const DEFAULT_FORM: FormData = {
  first_name: '',
  last_name: '',
  middle_name: '',
  degree: '',
  suffix: '',
  email: '',
  phone: '',
  date_of_birth: '',
  ssn: '',
  citizenship: '',
  birthplace: '',
  home_address: '',
  home_city: '',
  home_state: '',
  home_zip: '',
  showOfficeAddress: false,
  office_address: '',
  office_city: '',
  office_state: '',
  office_zip: '',
  specialty: '',
  npi_number: '',
  dea_number: '',
  dea_expiration: '',
  licenses: [],
  documents: [],
  certify: false,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INPUT =
  'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent'
const INPUT_ERR =
  'w-full px-3 py-2.5 border border-red-400 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent'
const BTN_PRIMARY =
  'bg-[#4A90D9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#3A7BC8] transition-colors disabled:opacity-50'
const BTN_OUTLINE =
  'border border-[#4A90D9] text-[#4A90D9] px-6 py-3 rounded-lg font-semibold hover:bg-[#F0F6FF] transition-colors'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function maskSSN(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 5) return '\u2022'.repeat(digits.length)
  return '\u2022\u2022\u2022-\u2022\u2022-' + digits.slice(5)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CredentialingIntakePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>({ ...DEFAULT_FORM })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [sessionId] = useState(() => crypto.randomUUID())
  const [ssnRaw, setSsnRaw] = useState('')
  const [specialtySearch, setSpecialtySearch] = useState('')
  const [specialtyOpen, setSpecialtyOpen] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const specialtyRef = useRef<HTMLDivElement>(null)

  // ---- helpers ----

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  )

  const clearError = useCallback(
    (key: string) => setErrors((prev) => { const n = { ...prev }; delete n[key]; return n }),
    [],
  )

  // ---- step validators ----

  function validateStep1(): boolean {
    const e: Record<string, string> = {}
    if (!form.first_name.trim()) e.first_name = 'First name is required'
    if (!form.last_name.trim()) e.last_name = 'Last name is required'
    if (!form.degree) e.degree = 'Degree is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    else if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a 10-digit phone number'
    if (!form.date_of_birth) e.date_of_birth = 'Date of birth is required'
    if (ssnRaw.length < 9) e.ssn = 'Enter a valid 9-digit SSN'
    if (!form.home_address.trim()) e.home_address = 'Address is required'
    if (!form.home_city.trim()) e.home_city = 'City is required'
    if (!form.home_state) e.home_state = 'State is required'
    if (!form.home_zip.trim()) e.home_zip = 'ZIP code is required'
    else if (!/^\d{5}(-\d{4})?$/.test(form.home_zip.trim())) e.home_zip = 'Enter a valid ZIP code'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2(): boolean {
    const e: Record<string, string> = {}
    if (!form.specialty) e.specialty = 'Specialty is required'
    if (!form.npi_number.trim()) e.npi_number = 'NPI number is required'
    else if (!/^\d{10}$/.test(form.npi_number.trim())) e.npi_number = 'NPI must be 10 digits'
    if (form.licenses.length === 0) e.licenses = 'At least one state license is required'
    form.licenses.forEach((lic, i) => {
      if (!lic.state) e[`lic_${i}_state`] = 'State is required'
      if (!lic.license_number.trim()) e[`lic_${i}_number`] = 'License number is required'
      if (!lic.expiration_date) e[`lic_${i}_exp`] = 'Expiration date is required'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep3(): boolean {
    const uploaded = new Set(form.documents.map((d) => d.document_type))
    const missing = REQUIRED_DOCS.filter((d) => !uploaded.has(d.key))
    if (missing.length > 0) {
      const e: Record<string, string> = {}
      missing.forEach((d) => { e[d.key] = `${d.label} is required` })
      setErrors(e)
      return false
    }
    setErrors({})
    return true
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step === 3 && !validateStep3()) return
    setStep((s) => Math.min(s + 1, 4))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    setErrors({})
    setStep((s) => Math.max(s - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToStep(s: number) {
    setErrors({})
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ---- license management ----

  function addLicense() {
    set('licenses', [
      ...form.licenses,
      { state: '', license_number: '', active: true, date_granted: '', expiration_date: '' },
    ])
  }

  function updateLicense(index: number, partial: Partial<License>) {
    const updated = form.licenses.map((l, i) => (i === index ? { ...l, ...partial } : l))
    set('licenses', updated)
  }

  function removeLicense(index: number) {
    set('licenses', form.licenses.filter((_, i) => i !== index))
  }

  // ---- file upload ----

  async function handleUpload(documentType: string, file: File) {
    setUploadingDoc(documentType)
    setUploadErrors((prev) => { const n = { ...prev }; delete n[documentType]; return n })
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('document_type', documentType)
      body.append('session_id', sessionId)
      const res = await fetch('/api/credentialing/upload', { method: 'POST', body })
      const data = await res.json()
      if (data.success) {
        setForm((prev) => ({
          ...prev,
          documents: [
            ...prev.documents.filter((d) => d.document_type !== documentType),
            {
              id: data.documentId,
              document_type: documentType,
              file_name: data.fileName ?? file.name,
              file_size: data.fileSize ?? file.size,
            },
          ],
        }))
        clearError(documentType)
      } else {
        setUploadErrors((prev) => ({ ...prev, [documentType]: data.error ?? 'Upload failed' }))
      }
    } catch {
      setUploadErrors((prev) => ({ ...prev, [documentType]: 'Upload failed. Please try again.' }))
    } finally {
      setUploadingDoc(null)
    }
  }

  function removeDocument(documentType: string) {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.document_type !== documentType),
    }))
  }

  // ---- submission ----

  async function handleSubmit() {
    if (!form.certify) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/credentialing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          first_name: form.first_name,
          last_name: form.last_name,
          middle_name: form.middle_name,
          degree: form.degree,
          suffix: form.suffix,
          email: form.email,
          phone: form.phone,
          date_of_birth: form.date_of_birth,
          ssn: ssnRaw,
          citizenship: form.citizenship,
          birthplace: form.birthplace,
          home_address: form.home_address,
          home_city: form.home_city,
          home_state: form.home_state,
          home_zip: form.home_zip,
          office_address: form.showOfficeAddress ? form.office_address : '',
          office_city: form.showOfficeAddress ? form.office_city : '',
          office_state: form.showOfficeAddress ? form.office_state : '',
          office_zip: form.showOfficeAddress ? form.office_zip : '',
          specialty: form.specialty,
          npi_number: form.npi_number,
          dea_number: form.dea_number,
          dea_expiration: form.dea_expiration,
          licenses: form.licenses,
          states_of_license: form.licenses.map((l) => l.state),
          document_ids: form.documents.map((d) => d.id),
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(
          `/credentialing/confirmation?code=${data.trackingCode}&name=${encodeURIComponent(form.last_name)}`,
        )
      } else {
        setSubmitError(data.error ?? 'Submission failed. Please try again.')
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ---- filtered specialties ----
  const filteredSpecialties = specialtySearch
    ? SPECIALTIES.filter((s) => s.toLowerCase().includes(specialtySearch.toLowerCase()))
    : SPECIALTIES

  // ---- drag helpers ----
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(documentType: string) {
    return (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files?.[0]
      if (file) handleUpload(documentType, file)
    }
  }

  // ======================================================================
  // RENDER
  // ======================================================================

  const STEP_LABELS = ['Personal', 'Professional', 'Documents', 'Review']

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ---- Progress Bar ---- */}
      <div className="flex items-center justify-between mb-8">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1
          const completed = step > num
          const active = step === num
          return (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                    completed
                      ? 'bg-[#4A90D9] text-white'
                      : active
                        ? 'bg-[#4A90D9] text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {completed ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    num
                  )}
                </div>
                <span
                  className={`text-xs hidden sm:inline font-medium ${
                    active ? 'text-[#2C5F8A]' : completed ? 'text-[#4A90D9]' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < 3 && (
                <div
                  className="w-8 sm:w-16 h-0.5 mx-2"
                  style={{ background: step > num ? '#4A90D9' : '#e5e7eb' }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* ==================================================================
          STEP 1 — Personal Information
          ================================================================== */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#2C5F8A]">Personal Information</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your legal name and contact details exactly as they appear on your medical license.
            </p>
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => { set('first_name', e.target.value); clearError('first_name') }}
                className={errors.first_name ? INPUT_ERR : INPUT}
                placeholder="First name"
              />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => { set('last_name', e.target.value); clearError('last_name') }}
                className={errors.last_name ? INPUT_ERR : INPUT}
                placeholder="Last name"
              />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input
                type="text"
                value={form.middle_name}
                onChange={(e) => set('middle_name', e.target.value)}
                className={INPUT}
                placeholder="Middle name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Degree <span className="text-red-500">*</span>
              </label>
              <select
                value={form.degree}
                onChange={(e) => { set('degree', e.target.value); clearError('degree') }}
                className={errors.degree ? INPUT_ERR : INPUT}
              >
                <option value="">Select degree</option>
                {DEGREES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.degree && <p className="text-red-500 text-xs mt-1">{errors.degree}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suffix</label>
              <input
                type="text"
                value={form.suffix}
                onChange={(e) => set('suffix', e.target.value)}
                className={INPUT}
                placeholder="Jr., III, etc."
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => { set('email', e.target.value); clearError('email') }}
                className={errors.email ? INPUT_ERR : INPUT}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  set('phone', formatted)
                  clearError('phone')
                }}
                className={errors.phone ? INPUT_ERR : INPUT}
                placeholder="(555) 123-4567"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* DOB / SSN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => { set('date_of_birth', e.target.value); clearError('date_of_birth') }}
                className={errors.date_of_birth ? INPUT_ERR : INPUT}
              />
              {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Social Security Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={maskSSN(ssnRaw)}
                onChange={(e) => {
                  // Allow typing digits in, handle backspace
                  const newVal = e.target.value
                  const currentMasked = maskSSN(ssnRaw)
                  if (newVal.length < currentMasked.length) {
                    // backspace
                    setSsnRaw((prev) => prev.slice(0, -1))
                    set('ssn', ssnRaw.slice(0, -1))
                  } else {
                    // typed something — extract last char
                    const lastChar = newVal.slice(-1)
                    if (/\d/.test(lastChar) && ssnRaw.length < 9) {
                      const next = ssnRaw + lastChar
                      setSsnRaw(next)
                      set('ssn', next)
                    }
                  }
                  clearError('ssn')
                }}
                className={errors.ssn ? INPUT_ERR : INPUT}
                placeholder="\u2022\u2022\u2022-\u2022\u2022-\u2022\u2022\u2022\u2022"
                autoComplete="off"
              />
              {errors.ssn && <p className="text-red-500 text-xs mt-1">{errors.ssn}</p>}
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Encrypted and stored securely. Required for credentialing verification.
              </p>
            </div>
          </div>

          {/* Citizenship / Birthplace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Citizenship</label>
              <input
                type="text"
                value={form.citizenship}
                onChange={(e) => set('citizenship', e.target.value)}
                className={INPUT}
                placeholder="e.g. United States"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
              <input
                type="text"
                value={form.birthplace}
                onChange={(e) => set('birthplace', e.target.value)}
                className={INPUT}
                placeholder="City, State or Country"
              />
            </div>
          </div>

          {/* Home Address */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Home Address <span className="text-red-500">*</span></h3>
            <div className="space-y-3">
              <input
                type="text"
                value={form.home_address}
                onChange={(e) => { set('home_address', e.target.value); clearError('home_address') }}
                className={errors.home_address ? INPUT_ERR : INPUT}
                placeholder="Street address"
              />
              {errors.home_address && <p className="text-red-500 text-xs mt-1">{errors.home_address}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <input
                    type="text"
                    value={form.home_city}
                    onChange={(e) => { set('home_city', e.target.value); clearError('home_city') }}
                    className={errors.home_city ? INPUT_ERR : INPUT}
                    placeholder="City"
                  />
                  {errors.home_city && <p className="text-red-500 text-xs mt-1">{errors.home_city}</p>}
                </div>
                <div>
                  <select
                    value={form.home_state}
                    onChange={(e) => { set('home_state', e.target.value); clearError('home_state') }}
                    className={errors.home_state ? INPUT_ERR : INPUT}
                  >
                    <option value="">State</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.home_state && <p className="text-red-500 text-xs mt-1">{errors.home_state}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.home_zip}
                    onChange={(e) => { set('home_zip', e.target.value.replace(/[^\d-]/g, '').slice(0, 10)); clearError('home_zip') }}
                    className={errors.home_zip ? INPUT_ERR : INPUT}
                    placeholder="ZIP"
                  />
                  {errors.home_zip && <p className="text-red-500 text-xs mt-1">{errors.home_zip}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Office Address toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showOfficeAddress}
                onChange={(e) => set('showOfficeAddress', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#4A90D9] focus:ring-[#4A90D9]"
              />
              <span className="text-sm text-gray-700">Add office / practice address</span>
            </label>
          </div>

          {form.showOfficeAddress && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Office Address</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={form.office_address}
                  onChange={(e) => set('office_address', e.target.value)}
                  className={INPUT}
                  placeholder="Street address"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <input
                      type="text"
                      value={form.office_city}
                      onChange={(e) => set('office_city', e.target.value)}
                      className={INPUT}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <select
                      value={form.office_state}
                      onChange={(e) => set('office_state', e.target.value)}
                      className={INPUT}
                    >
                      <option value="">State</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.office_zip}
                      onChange={(e) => set('office_zip', e.target.value.replace(/[^\d-]/g, '').slice(0, 10))}
                      className={INPUT}
                      placeholder="ZIP"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-end pt-4">
            <button type="button" onClick={goNext} className={BTN_PRIMARY}>
              Continue to Professional Info
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================
          STEP 2 — Professional Information
          ================================================================== */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#2C5F8A]">Professional Information</h2>
            <p className="text-sm text-gray-500 mt-1">
              Provide your specialty, NPI, DEA, and active state license details.
            </p>
          </div>

          {/* Specialty — searchable dropdown */}
          <div ref={specialtyRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Specialty <span className="text-red-500">*</span>
            </label>
            {form.specialty && !specialtyOpen ? (
              <div
                className="flex items-center justify-between w-full px-3 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:border-[#4A90D9]"
                onClick={() => { setSpecialtyOpen(true); setSpecialtySearch('') }}
              >
                <span className="text-[16px]">{form.specialty}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={specialtySearch}
                  onChange={(e) => {
                    setSpecialtySearch(e.target.value)
                    setSpecialtyOpen(true)
                    clearError('specialty')
                  }}
                  onFocus={() => setSpecialtyOpen(true)}
                  className={errors.specialty ? INPUT_ERR : INPUT}
                  placeholder="Search specialties..."
                  autoComplete="off"
                />
                {specialtyOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSpecialties.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">No matches found</div>
                    ) : (
                      filteredSpecialties.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#F0F6FF] transition-colors"
                          onClick={() => {
                            set('specialty', s)
                            setSpecialtySearch('')
                            setSpecialtyOpen(false)
                            clearError('specialty')
                          }}
                        >
                          {s}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
            {errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty}</p>}
          </div>

          {/* NPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NPI Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.npi_number}
                onChange={(e) => {
                  set('npi_number', e.target.value.replace(/\D/g, '').slice(0, 10))
                  clearError('npi_number')
                }}
                className={errors.npi_number ? INPUT_ERR : INPUT}
                placeholder="10-digit NPI"
              />
              {errors.npi_number && <p className="text-red-500 text-xs mt-1">{errors.npi_number}</p>}
            </div>
          </div>

          {/* DEA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DEA Number</label>
              <input
                type="text"
                value={form.dea_number}
                onChange={(e) => set('dea_number', e.target.value)}
                className={INPUT}
                placeholder="DEA registration number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DEA Expiration</label>
              <input
                type="date"
                value={form.dea_expiration}
                onChange={(e) => set('dea_expiration', e.target.value)}
                className={INPUT}
              />
            </div>
          </div>

          {/* State Licenses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">
                  State Medical Licenses <span className="text-red-500">*</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Add all active and recently held licenses</p>
              </div>
              <button
                type="button"
                onClick={addLicense}
                className="text-sm font-medium text-[#4A90D9] hover:text-[#2C5F8A] flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add License
              </button>
            </div>
            {errors.licenses && <p className="text-red-500 text-xs mb-2">{errors.licenses}</p>}

            {form.licenses.length === 0 && (
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-[#4A90D9] transition-colors"
                onClick={addLicense}
              >
                <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm text-gray-400">Click to add your first state license</p>
              </div>
            )}

            <div className="space-y-4">
              {form.licenses.map((lic, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white relative">
                  <button
                    type="button"
                    onClick={() => removeLicense(i)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove license"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">State <span className="text-red-500">*</span></label>
                      <select
                        value={lic.state}
                        onChange={(e) => { updateLicense(i, { state: e.target.value }); clearError(`lic_${i}_state`) }}
                        className={errors[`lic_${i}_state`] ? INPUT_ERR : INPUT}
                      >
                        <option value="">Select state</option>
                        {US_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {errors[`lic_${i}_state`] && <p className="text-red-500 text-xs mt-1">{errors[`lic_${i}_state`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">License Number <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={lic.license_number}
                        onChange={(e) => { updateLicense(i, { license_number: e.target.value }); clearError(`lic_${i}_number`) }}
                        className={errors[`lic_${i}_number`] ? INPUT_ERR : INPUT}
                        placeholder="License number"
                      />
                      {errors[`lic_${i}_number`] && <p className="text-red-500 text-xs mt-1">{errors[`lic_${i}_number`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date Granted</label>
                      <input
                        type="date"
                        value={lic.date_granted}
                        onChange={(e) => updateLicense(i, { date_granted: e.target.value })}
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Expiration Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={lic.expiration_date}
                        onChange={(e) => { updateLicense(i, { expiration_date: e.target.value }); clearError(`lic_${i}_exp`) }}
                        className={errors[`lic_${i}_exp`] ? INPUT_ERR : INPUT}
                      />
                      {errors[`lic_${i}_exp`] && <p className="text-red-500 text-xs mt-1">{errors[`lic_${i}_exp`]}</p>}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lic.active}
                      onChange={(e) => updateLicense(i, { active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-[#4A90D9] focus:ring-[#4A90D9]"
                    />
                    <span className="text-sm text-gray-600">Currently active</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <button type="button" onClick={goBack} className={BTN_OUTLINE}>
              Back
            </button>
            <button type="button" onClick={goNext} className={BTN_PRIMARY}>
              Continue to Documents
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================
          STEP 3 — Document Upload
          ================================================================== */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#2C5F8A]">Document Upload</h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload required and recommended documents. Accepted formats: PDF, JPG, PNG (max 10 MB each).
            </p>
          </div>

          {/* Required Documents */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Required Documents
            </h3>
            <div className="space-y-3">
              {REQUIRED_DOCS.map((doc) => {
                const uploaded = form.documents.find((d) => d.document_type === doc.key)
                const isUploading = uploadingDoc === doc.key
                return (
                  <div
                    key={doc.key}
                    className={`border rounded-lg p-4 transition-colors ${
                      uploaded
                        ? 'border-green-200 bg-green-50'
                        : errors[doc.key]
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-[#4A90D9]'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop(doc.key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {uploaded ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">{doc.label}</p>
                          {uploaded && (
                            <p className="text-xs text-gray-500 truncate">
                              {uploaded.file_name} ({formatFileSize(uploaded.file_size)})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isUploading ? (
                          <div className="flex items-center gap-2 text-sm text-[#4A90D9]">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Uploading...
                          </div>
                        ) : uploaded ? (
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.key)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[doc.key]?.click()}
                            className="text-sm font-medium text-[#4A90D9] hover:text-[#2C5F8A]"
                          >
                            Upload
                          </button>
                        )}
                      </div>
                    </div>
                    {uploadErrors[doc.key] && (
                      <p className="text-red-500 text-xs mt-2">{uploadErrors[doc.key]}</p>
                    )}
                    {errors[doc.key] && !uploaded && (
                      <p className="text-red-500 text-xs mt-2">{errors[doc.key]}</p>
                    )}
                    <input
                      ref={(el) => { fileInputRefs.current[doc.key] = el }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(doc.key, file)
                        e.target.value = ''
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recommended Documents */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4A90D9] inline-block" />
              Recommended Documents
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              These are not required to proceed, but uploading them now will speed up your credentialing.
            </p>
            <div className="space-y-3">
              {RECOMMENDED_DOCS.map((doc) => {
                const uploaded = form.documents.find((d) => d.document_type === doc.key)
                const isUploading = uploadingDoc === doc.key
                return (
                  <div
                    key={doc.key}
                    className={`border rounded-lg p-4 transition-colors ${
                      uploaded
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-[#4A90D9]'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop(doc.key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {uploaded ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">{doc.label}</p>
                          {uploaded && (
                            <p className="text-xs text-gray-500 truncate">
                              {uploaded.file_name} ({formatFileSize(uploaded.file_size)})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isUploading ? (
                          <div className="flex items-center gap-2 text-sm text-[#4A90D9]">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Uploading...
                          </div>
                        ) : uploaded ? (
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.key)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[doc.key]?.click()}
                            className="text-sm font-medium text-[#4A90D9] hover:text-[#2C5F8A]"
                          >
                            Upload
                          </button>
                        )}
                      </div>
                    </div>
                    {uploadErrors[doc.key] && (
                      <p className="text-red-500 text-xs mt-2">{uploadErrors[doc.key]}</p>
                    )}
                    <input
                      ref={(el) => { fileInputRefs.current[doc.key] = el }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(doc.key, file)
                        e.target.value = ''
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <button type="button" onClick={goBack} className={BTN_OUTLINE}>
              Back
            </button>
            <button type="button" onClick={goNext} className={BTN_PRIMARY}>
              Continue to Review
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================
          STEP 4 — Review & Submit
          ================================================================== */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#2C5F8A]">Review & Submit</h2>
            <p className="text-sm text-gray-500 mt-1">
              Please review all information below before submitting your credentialing application.
            </p>
          </div>

          {/* Personal Info Review */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-[#2C5F8A]">Personal Information</h3>
              <button type="button" onClick={() => goToStep(1)} className="text-xs font-medium text-[#4A90D9] hover:text-[#2C5F8A]">
                Edit
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <span className="text-gray-500">Name</span>
                <p className="font-medium text-gray-800">
                  {form.first_name} {form.middle_name ? `${form.middle_name} ` : ''}{form.last_name}
                  {form.suffix ? `, ${form.suffix}` : ''}{form.degree ? `, ${form.degree}` : ''}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Email</span>
                <p className="font-medium text-gray-800">{form.email}</p>
              </div>
              <div>
                <span className="text-gray-500">Phone</span>
                <p className="font-medium text-gray-800">{form.phone}</p>
              </div>
              <div>
                <span className="text-gray-500">Date of Birth</span>
                <p className="font-medium text-gray-800">{form.date_of_birth}</p>
              </div>
              <div>
                <span className="text-gray-500">SSN</span>
                <p className="font-medium text-gray-800">{maskSSN(ssnRaw)}</p>
              </div>
              {form.citizenship && (
                <div>
                  <span className="text-gray-500">Citizenship</span>
                  <p className="font-medium text-gray-800">{form.citizenship}</p>
                </div>
              )}
              {form.birthplace && (
                <div>
                  <span className="text-gray-500">Birthplace</span>
                  <p className="font-medium text-gray-800">{form.birthplace}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <span className="text-gray-500">Home Address</span>
                <p className="font-medium text-gray-800">
                  {form.home_address}, {form.home_city}, {form.home_state} {form.home_zip}
                </p>
              </div>
              {form.showOfficeAddress && form.office_address && (
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Office Address</span>
                  <p className="font-medium text-gray-800">
                    {form.office_address}, {form.office_city}, {form.office_state} {form.office_zip}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Professional Info Review */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-[#2C5F8A]">Professional Information</h3>
              <button type="button" onClick={() => goToStep(2)} className="text-xs font-medium text-[#4A90D9] hover:text-[#2C5F8A]">
                Edit
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <span className="text-gray-500">Specialty</span>
                  <p className="font-medium text-gray-800">{form.specialty}</p>
                </div>
                <div>
                  <span className="text-gray-500">NPI</span>
                  <p className="font-medium text-gray-800">{form.npi_number}</p>
                </div>
                {form.dea_number && (
                  <div>
                    <span className="text-gray-500">DEA Number</span>
                    <p className="font-medium text-gray-800">{form.dea_number}</p>
                  </div>
                )}
                {form.dea_expiration && (
                  <div>
                    <span className="text-gray-500">DEA Expiration</span>
                    <p className="font-medium text-gray-800">{form.dea_expiration}</p>
                  </div>
                )}
              </div>
              <div className="pt-2">
                <span className="text-gray-500">State Licenses</span>
                <div className="mt-2 space-y-2">
                  {form.licenses.map((lic, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-800">{lic.state}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">#{lic.license_number}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">Exp: {lic.expiration_date}</span>
                      {lic.active && (
                        <span className="ml-auto text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Documents Review */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-[#2C5F8A]">Uploaded Documents ({form.documents.length})</h3>
              <button type="button" onClick={() => goToStep(3)} className="text-xs font-medium text-[#4A90D9] hover:text-[#2C5F8A]">
                Edit
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {form.documents.map((doc) => {
                  const meta =
                    REQUIRED_DOCS.find((d) => d.key === doc.document_type) ??
                    RECOMMENDED_DOCS.find((d) => d.key === doc.document_type)
                  return (
                    <div key={doc.id} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium text-gray-800">{meta?.label ?? doc.document_type}</span>
                      <span className="text-gray-400 truncate hidden sm:inline">- {doc.file_name}</span>
                      <span className="ml-auto text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Authorization & Submit */}
          <div className="border border-[#4A90D9]/20 rounded-lg bg-[#F0F6FF] p-4 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.certify}
                onChange={(e) => set('certify', e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#4A90D9] focus:ring-[#4A90D9]"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                I certify that all information provided in this application is true, complete, and accurate to the best of my knowledge. I understand that any misrepresentation or omission may result in denial or revocation of credentialing privileges. I authorize MedCare Staffing and its credentialing agents to verify all information submitted.
              </span>
            </label>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button type="button" onClick={goBack} className={BTN_OUTLINE}>
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!form.certify || submitting}
                className={BTN_PRIMARY}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
