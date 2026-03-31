'use client'

import { useState, useMemo } from 'react'
import { updateJurisdictions } from '@/app/admin/actions/candidates'

// Dynamic import of county data to avoid blocking initial load
let _counties: { name: string; state: string; fips: string }[] | null = null
async function getCounties() {
  if (!_counties) {
    const mod = await import('@/data/us-counties')
    _counties = mod.US_COUNTIES
  }
  return _counties
}

type Jurisdiction = {
  type: 'county' | 'city' | 'state' | 'federal'
  name: string
  state: string
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
]

export default function JurisdictionManager({
  candidateId,
  jurisdictions: initialJurisdictions,
  candidateAddress,
}: {
  candidateId: string
  jurisdictions: Jurisdiction[]
  candidateAddress?: string
}) {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>(initialJurisdictions)
  const [countySearch, setCountySearch] = useState('')
  const [countyResults, setCountyResults] = useState<{ name: string; state: string }[]>([])
  const [stateSearch, setStateSearch] = useState('')
  const [federalChecked, setFederalChecked] = useState(
    jurisdictions.some(j => j.type === 'federal')
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function searchCounties(query: string) {
    setCountySearch(query)
    if (query.length < 2) {
      setCountyResults([])
      return
    }
    const counties = await getCounties()
    const lower = query.toLowerCase()
    const matches = counties.filter(c =>
      c.name.toLowerCase().includes(lower) || c.state.toLowerCase().includes(lower)
    ).slice(0, 10)
    setCountyResults(matches)
  }

  function addCounty(county: { name: string; state: string }) {
    const exists = jurisdictions.some(j => j.type === 'county' && j.name === county.name && j.state === county.state)
    if (!exists) {
      setJurisdictions([...jurisdictions, { type: 'county', name: county.name, state: county.state }])
    }
    setCountySearch('')
    setCountyResults([])
  }

  function addState(state: string) {
    const exists = jurisdictions.some(j => j.type === 'state' && j.state === state)
    if (!exists) {
      setJurisdictions([...jurisdictions, { type: 'state', name: `Statewide — ${state}`, state }])
    }
    setStateSearch('')
  }

  function toggleFederal() {
    const next = !federalChecked
    setFederalChecked(next)
    if (next) {
      setJurisdictions([...jurisdictions, { type: 'federal', name: 'Federal Criminal Search', state: 'US' }])
    } else {
      setJurisdictions(jurisdictions.filter(j => j.type !== 'federal'))
    }
  }

  function remove(index: number) {
    const j = jurisdictions[index]
    if (j.type === 'federal') setFederalChecked(false)
    setJurisdictions(jurisdictions.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setSaving(true)
    await updateJurisdictions({ candidateId, jurisdictions })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Search Jurisdictions</h2>

      {/* Current Jurisdictions */}
      {jurisdictions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {jurisdictions.map((j, i) => (
            <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              j.type === 'county' ? 'bg-blue-50 text-blue-700' :
              j.type === 'state' ? 'bg-purple-50 text-purple-700' :
              j.type === 'federal' ? 'bg-red-50 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {j.name}, {j.state}
              <button onClick={() => remove(i)} className="hover:text-red-500 ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* County Search */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">County Criminal Search</label>
          <div className="relative">
            <input
              type="text"
              value={countySearch}
              onChange={(e) => searchCounties(e.target.value)}
              placeholder="Type county name..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
            {countyResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {countyResults.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => addCounty(c)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    {c.name}, {c.state}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* State Search */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Statewide Criminal Search</label>
          <select
            value={stateSearch}
            onChange={(e) => { addState(e.target.value); e.target.value = '' }}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">Select state...</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Federal Toggle */}
      <label className="flex items-center gap-2 mt-3 cursor-pointer">
        <input type="checkbox" checked={federalChecked} onChange={toggleFederal} className="rounded" />
        <span className="text-sm text-gray-700">Federal Criminal Search</span>
      </label>

      {/* Save */}
      <div className="mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Jurisdictions'}
        </button>
      </div>
    </div>
  )
}
