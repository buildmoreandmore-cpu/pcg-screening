'use client'

import { useState, useRef, useEffect } from 'react'
import states from './us-states.json'

interface StatePickerProps {
  selected: string[]
  onChange: (states: string[]) => void
  multi?: boolean
  disabled?: boolean
  placeholder?: string
}

export default function StatePicker({ selected, onChange, multi = true, disabled = false, placeholder = 'Search states...' }: StatePickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = states.filter(
    s =>
      (s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.abbr.toLowerCase().includes(query.toLowerCase())) &&
      (multi || !selected.includes(s.abbr))
  )

  function toggle(abbr: string) {
    if (multi) {
      onChange(selected.includes(abbr) ? selected.filter(s => s !== abbr) : [...selected, abbr])
    } else {
      onChange([abbr])
      setOpen(false)
      setQuery('')
    }
  }

  function remove(abbr: string) {
    onChange(selected.filter(s => s !== abbr))
  }

  if (disabled) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {selected.length === 0 ? (
          <span className="text-sm text-gray-400">None selected</span>
        ) : (
          selected.map(abbr => (
            <span key={abbr} className="px-2 py-0.5 bg-navy/5 text-navy text-xs rounded-md font-medium">
              {abbr}
            </span>
          ))
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      {multi && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(abbr => (
            <span key={abbr} className="inline-flex items-center gap-1 px-2 py-0.5 bg-navy/10 text-navy text-xs rounded-md font-medium">
              {abbr}
              <button type="button" onClick={() => remove(abbr)} className="hover:text-red-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={!multi && selected.length > 0 && !open ? states.find(s => s.abbr === selected[0])?.name || selected[0] : query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">No matches</div>
          ) : (
            filtered.map(s => (
              <button
                key={s.abbr}
                type="button"
                onClick={() => toggle(s.abbr)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                  selected.includes(s.abbr) ? 'bg-navy/5 text-navy font-medium' : 'text-gray-700'
                }`}
              >
                <span>{s.name} ({s.abbr})</span>
                {selected.includes(s.abbr) && (
                  <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
