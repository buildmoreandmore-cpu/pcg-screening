'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNewClient } from '@/app/admin/actions/clients'
import Link from 'next/link'
import PackageComponentsModal, { type PackageDraft } from '@/components/admin/PackageComponentsModal'
import { countComponents } from '@/lib/screening-components'

type Package = {
  name: string
  price: string
  description: string
  features: string[]
  components: Record<string, boolean>
  customNotes: string
}

const defaultPackages: Package[] = [
  { name: 'Basic Background Check', price: '29', description: 'SSN trace + national criminal', features: ['SSN Verification', 'National Criminal'], components: { social_security_trace: true, criminal_history: true }, customNotes: '' },
  { name: 'Standard Background Check', price: '49', description: 'Basic + county criminal + sex offender', features: [], components: { social_security_trace: true, criminal_history: true, sex_offender: true }, customNotes: '' },
  { name: 'Premium Background Check', price: '79', description: 'Standard + employment + education verification', features: [], components: { social_security_trace: true, criminal_history: true, sex_offender: true, employment: true, education: true }, customNotes: '' },
  { name: 'Drug Test Add-On', price: '45', description: '10-panel drug screening', features: [], components: {}, customNotes: '10-panel urine drug screening' },
]

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Company info
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [contactFirstName, setContactFirstName] = useState('')
  const [contactLastName, setContactLastName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')

  // Billing terms
  const [billingType, setBillingType] = useState('net_30')

  // Packages
  const [packages, setPackages] = useState<Package[]>(defaultPackages)
  const [editingComponentsIndex, setEditingComponentsIndex] = useState<number | null>(null)

  // Invite first user
  const [inviteUser, setInviteUser] = useState(true)

  function updatePackage(index: number, field: keyof Package, value: string | string[]) {
    const updated = [...packages]
    updated[index] = { ...updated[index], [field]: value }
    setPackages(updated)
  }

  function removePackage(index: number) {
    setPackages(packages.filter((_, i) => i !== index))
  }

  function addPackage() {
    setPackages([...packages, { name: '', price: '', description: '', features: [], components: {}, customNotes: '' }])
  }

  function applyComponentsDraft(index: number, draft: PackageDraft) {
    const updated = [...packages]
    updated[index] = {
      ...updated[index],
      name: draft.name || updated[index].name,
      price: draft.priceCents ? (draft.priceCents / 100).toString() : updated[index].price,
      description: draft.description || updated[index].description,
      components: draft.components,
      customNotes: draft.customNotes,
    }
    setPackages(updated)
    setEditingComponentsIndex(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await createNewClient({
      name,
      slug: slug || slugify(name),
      contactName: `${contactFirstName} ${contactLastName}`.trim(),
      contactEmail,
      contactPhone,
      website,
      address,
      city,
      state,
      zip,
      billingType,
      packages: packages.filter(p => p.name && p.price).map(p => ({
        name: p.name,
        price: Number(p.price),
        description: p.description,
        features: p.features,
        components: p.components,
        customNotes: p.customNotes,
      })),
      inviteUser,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.warning) {
      // Client was created, but the invite email blew up. Surface it before
      // navigating away so the admin actually sees what went wrong.
      alert(result.warning)
    }

    router.push(`/admin/clients/${result.clientId}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
        Back to Clients
      </Link>

      <h1 className="font-heading text-2xl text-navy">Onboard New Client</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">Company Information</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Company Name *</label>
              <input type="text" required value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Portal Slug</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-corp"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent font-mono" />
              <p className="text-[11px] text-gray-400 mt-1 truncate">www.pcgscreening.net/apply/{slug || 'your-slug'}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Website</label>
              <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contact First Name</label>
              <input type="text" value={contactFirstName} onChange={(e) => setContactFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contact Last Name</label>
              <input type="text" value={contactLastName} onChange={(e) => setContactLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contact Email *</label>
              <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">State</label>
                <input type="text" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Zip</label>
                <input type="text" value={zip} onChange={(e) => setZip(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Billing Terms */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">Billing Terms</h2>
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
            <h2 className="text-sm font-medium text-gray-700">Screening Packages</h2>
            <button type="button" onClick={addPackage} className="text-sm text-gold hover:text-gold-light transition-colors">+ Add Package</button>
          </div>
          <div className="space-y-3">
            {packages.map((pkg, i) => {
              const compCount = countComponents(pkg.components)
              return (
                <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-1">
                      <input type="text" value={pkg.name} onChange={(e) => updatePackage(i, 'name', e.target.value)}
                        placeholder="Package name" className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
                      <div className="flex items-center">
                        <span className="text-sm text-gray-400 mr-1">$</span>
                        <input type="number" value={pkg.price} onChange={(e) => updatePackage(i, 'price', e.target.value)}
                          placeholder="0" className="w-20 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
                      </div>
                    </div>
                    <button type="button" onClick={() => removePackage(i)} className="text-gray-400 hover:text-red-500 ml-2 text-sm">Remove</button>
                  </div>
                  <input type="text" value={pkg.description} onChange={(e) => updatePackage(i, 'description', e.target.value)}
                    placeholder="Description" className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-gray-500">
                      {compCount} screening component{compCount === 1 ? '' : 's'} selected
                      {pkg.customNotes ? ' · custom notes added' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingComponentsIndex(i)}
                      className="text-xs text-gold hover:text-navy font-medium transition-colors"
                    >
                      Configure components →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Invite User */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={inviteUser} onChange={(e) => setInviteUser(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700">Send portal invitation to contact email after creating</span>
          </label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-white py-3 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating Client...' : 'Create Client & Generate Portal'}
        </button>
      </form>

      <PackageComponentsModal
        open={editingComponentsIndex !== null}
        title={
          editingComponentsIndex !== null
            ? `Configure: ${packages[editingComponentsIndex]?.name || 'Package'}`
            : 'Configure Package'
        }
        initial={
          editingComponentsIndex !== null
            ? {
                name: packages[editingComponentsIndex].name,
                priceCents: Math.round(Number(packages[editingComponentsIndex].price || 0) * 100),
                description: packages[editingComponentsIndex].description,
                components: packages[editingComponentsIndex].components,
                customNotes: packages[editingComponentsIndex].customNotes,
              }
            : { name: '', priceCents: 0, description: '', components: {}, customNotes: '' }
        }
        onSave={(draft) => {
          if (editingComponentsIndex !== null) applyComponentsDraft(editingComponentsIndex, draft)
        }}
        onClose={() => setEditingComponentsIndex(null)}
      />
    </div>
  )
}
