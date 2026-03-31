'use client'

import { useState, useRef, useEffect } from 'react'

interface ScreeningSectionProps {
  title: string
  description?: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  mode: 'edit' | 'view'
  children?: React.ReactNode
}

export default function ScreeningSection({ title, description, enabled, onToggle, mode, children }: ScreeningSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    }
  }, [enabled, children])

  if (mode === 'view' && !enabled) return null

  return (
    <div className={`rounded-xl border transition-colors ${
      enabled
        ? mode === 'view' ? 'border-l-4 border-l-green-500 border-gray-100 bg-white' : 'border-gray-200 bg-white'
        : 'border-gray-100 bg-gray-50/50'
    }`}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        {mode === 'view' ? (
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
            {enabled ? (
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => onToggle(!enabled)}
            className={`relative w-10 h-[22px] rounded-full shrink-0 transition-colors ${enabled ? 'bg-navy' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${enabled ? 'left-[20px]' : 'left-[2px]'}`} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${enabled ? 'text-navy' : 'text-gray-400'}`}>{title}</p>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>

      <div
        style={{ maxHeight: enabled ? height + 16 : 0 }}
        className="overflow-hidden transition-[max-height] duration-200 ease-in-out"
      >
        <div ref={contentRef} className="px-4 pb-4 pt-1 border-t border-gray-100">
          {children}
        </div>
      </div>
    </div>
  )
}

/* Reusable sub-option checkbox */
export function SubOption({
  label,
  checked,
  onChange,
  disabled = false,
  note,
  children,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  note?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mt-3 first:mt-0">
      <label className={`flex items-start gap-2.5 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
        {disabled ? (
          <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-navy/10 border-navy/30' : 'border-gray-200 bg-gray-50'}`}>
            {checked && <svg className="w-3 h-3 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </span>
        ) : (
          <input
            type="checkbox"
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-navy focus:ring-gold shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <span className={`text-sm ${checked ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
          {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
        </div>
      </label>
      {checked && children && <div className="ml-6.5 mt-2 pl-[26px]">{children}</div>}
    </div>
  )
}

/* Reusable text input for screening fields */
export function ScreeningInput({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  type = 'text',
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  type?: 'text' | 'textarea'
}) {
  if (disabled) {
    return (
      <div className="mt-2">
        {label && <p className="text-xs text-gray-500 mb-0.5">{label}</p>}
        <p className="text-sm text-gray-900">{value || <span className="text-gray-400">Not provided</span>}</p>
      </div>
    )
  }

  if (type === 'textarea') {
    return (
      <div className="mt-2">
        {label && <label className="block text-xs text-gray-600 mb-1">{label}</label>}
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold resize-none"
        />
      </div>
    )
  }

  return (
    <div className="mt-2">
      {label && <label className="block text-xs text-gray-600 mb-1">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
      />
    </div>
  )
}
