'use client'

import { useState } from 'react'
import { updateClientSettings } from '@/app/admin/actions/clients'

type Package = { name: string; price: number; description: string; features: string[] }

const DEFAULT_NOTIFICATION_PREFS = {
  pcg_admin: {
    new_order: true,
    no_response_48h: true,
    payment_received: true,
    consent_signed: true,
    drug_test_received: true,
    report_completed: true,
  },
  client: {
    order_received: true,
    status_updates: false,
    consent_signed: false,
    drug_test_received: false,
    report_completed: true,
  },
  candidate: {
    intake_link: true,
    payment_confirmation: true,
    consent_request: true,
    order_received: true,
    status_updates: false,
    consent_signed: false,
    drug_test_received: false,
  },
}

const NOTIFICATION_LABELS: Record<string, Record<string, string>> = {
  pcg_admin: {
    new_order: 'New order submitted',
    no_response_48h: 'No response in 48 hours',
    payment_received: 'Payment received',
    consent_signed: 'Consent signed',
    drug_test_received: 'Drug test results received',
    report_completed: 'Report completed',
  },
  client: {
    order_received: 'Order received',
    status_updates: 'Status updates',
    consent_signed: 'Consent signed',
    drug_screen_ordered: 'Drug screen ordered',
    drug_screen_collected: 'Drug screen sample collected',
    drug_test_received: 'Drug test results received',
    report_completed: 'Report completed',
  },
  candidate: {
    intake_link: 'Intake link',
    payment_confirmation: 'Payment confirmation',
    consent_request: 'Consent request',
    order_received: 'Order received',
    status_updates: 'Status updates',
    consent_signed: 'Consent signed',
    drug_test_received: 'Drug test results received',
  },
}

const AUDIENCE_LABELS: Record<string, { title: string; desc: string }> = {
  pcg_admin: { title: 'For YOU (PCG Admin)', desc: 'Notifications sent to PCG staff' },
  client: { title: 'For CLIENT (Employer)', desc: 'Notifications sent to the employer' },
  candidate: { title: 'For CANDIDATE', desc: 'Notifications sent to the candidate' },
}

export default function ClientSettingsForm({ client }: { client: any }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Company info
  const [name, setName] = useState(client.name || '')
  const initialFirst = (client.contact_name || '').split(' ')[0] || ''
  const initialLast = (client.contact_name || '').split(' ').slice(1).join(' ') || ''
  const [contactFirstName, setContactFirstName] = useState(initialFirst)
  const [contactLastName, setContactLastName] = useState(initialLast)
  const [contactEmail, setContactEmail] = useState(client.contact_email || '')
  const [contactPhone, setContactPhone] = useState(client.contact_phone || '')
  const [website, setWebsite] = useState(client.website || '')
  const [address, setAddress] = useState(client.address || '')
  const [city, setCity] = useState(client.city || '')
  const [state, setState] = useState(client.state || '')
  const [zip, setZip] = useState(client.zip || '')

  // Billing type
  const [billingType, setBillingType] = useState(client.billing_type || 'net_30')

  // Packages
  const [packages, setPackages] = useState<Package[]>(
    (client.packages || []).map((p: any) => ({
      name: p.name || '',
      price: p.price || 0,
      description: p.description || '',
      features: p.features || [],
    }))
  )

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const stored = client.notification_preferences || {}
    return {
      pcg_admin: { ...DEFAULT_NOTIFICATION_PREFS.pcg_admin, ...stored.pcg_admin },
      client: { ...DEFAULT_NOTIFICATION_PREFS.client, ...stored.client },
      candidate: { ...DEFAULT_NOTIFICATION_PREFS.candidate, ...stored.candidate },
    }
  })

  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  function updatePackage(index: number, field: keyof Package, value: any) {
    const updated = [...packages]
    updated[index] = { ...updated[index], [field]: value }
    setPackages(updated)
  }

  function removePackage(index: number) {
    setPackages(packages.filter((_, i) => i !== index))
  }

  function addPackage() {
    setPackages([...packages, { name: '', price: 0, description: '', features: [] }])
  }

  function toggleNotif(audience: string, event: string) {
    setNotifPrefs((prev: any) => ({
      ...prev,
      [audience]: {
        ...prev[audience],
        [event]: !prev[audience][event],
      },
    }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)

    const result = await updateClientSettings({
      clientId: client.id,
      name,
      contactName: `${contactFirstName} ${contactLastName}`.trim(),
      contactEmail,
      contactPhone,
      website,
      address,
      city,
      state,
      zip,
      packages: packages.filter(p => p.name).map(p => ({
        ...p,
        price: Number(p.price),
      })),
      billingType,
      notificationPreferences: notifPrefs,
    })

    setSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="space-y-5">
      {/* Company Info */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Company Information</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Company Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contact First Name</label>
            <input type="text" value={contactFirstName} onChange={e => setContactFirstName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contact Last Name</label>
            <input type="text" value={contactLastName} onChange={e => setContactLastName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Website</label>
            <input type="text" value={website} onChange={e => setWebsite(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
          </div>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">City</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">State</label>
              <input type="text" maxLength={2} value={state} onChange={e => setState(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Zip</label>
              <input type="text" value={zip} onChange={e => setZip(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* Billing Terms */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Billing Terms</h3>
        <p className="text-xs text-gray-400">Employer pays for all candidate screenings. Select the payment terms for this client.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { value: 'immediate', label: 'Immediate', desc: 'Due on completion' },
            { value: 'net_30', label: 'Net 30', desc: 'Due in 30 days' },
            { value: 'net_60', label: 'Net 60', desc: 'Due in 60 days' },
            { value: 'net_90', label: 'Net 90', desc: 'Due in 90 days' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setBillingType(opt.value)}
              className={`py-3 px-3 rounded-xl text-center border-2 transition-all ${
                billingType === opt.value
                  ? 'border-navy bg-navy/[0.03]'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <p className={`text-sm font-semibold ${billingType === opt.value ? 'text-navy' : 'text-gray-600'}`}>{opt.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Packages */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Screening Packages</h3>
          <button type="button" onClick={addPackage} className="text-sm text-gold hover:text-gold-light transition-colors">+ Add Package</button>
        </div>
        <div className="space-y-3">
          {packages.map((pkg, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-1">
                  <input type="text" value={pkg.name} onChange={e => updatePackage(i, 'name', e.target.value)}
                    placeholder="Package name" className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400 mr-1">$</span>
                    <input type="number" value={pkg.price} onChange={e => updatePackage(i, 'price', e.target.value)}
                      placeholder="0" className="w-20 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
                  </div>
                </div>
                <button type="button" onClick={() => removePackage(i)} className="text-gray-400 hover:text-red-500 ml-2 text-sm">Remove</button>
              </div>
              <input type="text" value={pkg.description} onChange={e => updatePackage(i, 'description', e.target.value)}
                placeholder="Description" className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
          ))}
          {packages.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No packages configured</p>}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Notification Preferences</h3>
        <p className="text-xs text-gray-400">Configure which email notifications are sent for this client's screenings.</p>

        <div className="space-y-2">
          {(['pcg_admin', 'client', 'candidate'] as const).map(audience => {
            const meta = AUDIENCE_LABELS[audience]
            const prefs = notifPrefs[audience] as Record<string, boolean>
            const labels = NOTIFICATION_LABELS[audience]
            const isOpen = expandedSection === audience

            return (
              <div key={audience} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedSection(isOpen ? null : audience)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-navy">{meta.title}</p>
                    <p className="text-xs text-gray-400">{meta.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-xs text-gray-400">
                      {Object.values(prefs).filter(Boolean).length}/{Object.keys(prefs).length} on
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
                    {Object.entries(labels).map(([event, label]) => (
                      <label key={event} className="flex items-center justify-between py-1.5 cursor-pointer">
                        <span className="text-sm text-gray-700">{label}</span>
                        <button
                          type="button"
                          onClick={() => toggleNotif(audience, event)}
                          className={`relative w-10 h-5.5 rounded-full transition-colors ${
                            prefs[event] ? 'bg-gold' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                            prefs[event] ? 'translate-x-[18px]' : ''
                          }`} style={{ width: '18px', height: '18px', top: '2px', left: '2px', transform: prefs[event] ? 'translateX(18px)' : 'translateX(0)' }} />
                        </button>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Save */}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-navy text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium animate-[fadeIn_0.3s_ease]">Settings saved</span>
        )}
      </div>
    </div>
  )
}
