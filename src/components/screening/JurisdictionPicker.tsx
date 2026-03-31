'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import type { Jurisdiction } from './screening-types'

// Lazy-load counties to avoid blocking initial render
let countiesCache: { name: string; state: string }[] | null = null
async function loadCounties() {
  if (countiesCache) return countiesCache
  const mod = await import('./us-counties.json')
  countiesCache = mod.default as { name: string; state: string }[]
  return countiesCache
}

interface JurisdictionPickerProps {
  selected: Jurisdiction[]
  onChange: (jurisdictions: Jurisdiction[]) => void
  disabled?: boolean
}

export default function JurisdictionPicker({ selected, onChange, disabled = false }: JurisdictionPickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [counties, setCounties] = useState<{ name: string; state: string }[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCounties().then(setCounties)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return counties
      .filter(c => {
        const full = `${c.name}, ${c.state}`.toLowerCase()
        return full.includes(q) || c.name.toLowerCase().startsWith(q)
      })
      .slice(0, 30)
  }, [query, counties])

  function add(county: { name: string; state: string }) {
    const exists = selected.some(s => s.name === county.name && s.state === county.state)
    if (!exists) {
      onChange([...selected, { type: 'county', name: county.name, state: county.state }])
    }
    setQuery('')
    setOpen(false)
  }

  function remove(idx: number) {
    onChange(selected.filter((_, i) => i !== idx))
  }

  if (disabled) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {selected.length === 0 ? (
          <span className="text-sm text-gray-400">None selected</span>
        ) : (
          selected.map((j, i) => (
            <span key={i} className="px-2 py-0.5 bg-navy/5 text-navy text-xs rounded-md font-medium">
              {j.name}, {j.state}
            </span>
          ))
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((j, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-navy/10 text-navy text-xs rounded-md font-medium">
              {j.name}, {j.state}
              <button type="button" onClick={() => remove(i)} className="hover:text-red-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Type county name (min 2 chars)..."
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.map((c, i) => (
            <button
              key={`${c.name}-${c.state}-${i}`}
              type="button"
              onClick={() => add(c)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {c.name}, {c.state}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
