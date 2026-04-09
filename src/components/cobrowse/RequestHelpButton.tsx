'use client'

import { useEffect, useRef, useState } from 'react'
import { useCobrowse } from './CobrowseProvider'

const SUPPORT_EMAIL = 'accounts@pcgscreening.com'
const SUPPORT_PHONE_DISPLAY = '(770) 716-1278'
const SUPPORT_PHONE_TEL = '+17707161278'
const USER_GUIDE_URL = '/employer-user-guide.pdf'

export default function RequestHelpButton() {
  const { state, requestHelp } = useCobrowse()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Don't show when session is active or ended
  useEffect(() => {
    if (state === 'active' || state === 'ended') setOpen(false)
  }, [state])

  // Outside click + Escape to close
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (state === 'active' || state === 'ended') return null

  const isPending = state === 'pending'

  async function handleShareScreen() {
    setOpen(false)
    await requestHelp()
  }

  return (
    <div ref={wrapRef} className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40">
      {/* Popover card */}
      {open && (
        <div className="absolute bottom-14 right-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-[fadeIn_0.15s_ease]">
          <div className="px-4 py-3 bg-navy text-white">
            <p className="text-sm font-semibold">Need help?</p>
            <p className="text-[11px] text-white/70 mt-0.5">Choose how you&apos;d like to get support</p>
          </div>
          <div className="py-1">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-navy/5 text-navy shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Email support</p>
                <p className="text-xs text-gray-500 truncate">{SUPPORT_EMAIL}</p>
              </div>
            </a>
            <a
              href={`tel:${SUPPORT_PHONE_TEL}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-navy/5 text-navy shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a2 2 0 011.94 1.515l.7 2.805a2 2 0 01-.45 1.89l-1.27 1.27a16 16 0 006.586 6.586l1.27-1.27a2 2 0 011.89-.45l2.805.7A2 2 0 0121 16.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Call support</p>
                <p className="text-xs text-gray-500">{SUPPORT_PHONE_DISPLAY}</p>
              </div>
            </a>
            <button
              onClick={handleShareScreen}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-navy/5 text-navy shrink-0">
                {isPending ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12H3v9a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 14.25v-9z" />
                  </svg>
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {isPending ? 'Connecting...' : 'Share my screen'}
                </p>
                <p className="text-xs text-gray-500">Let an admin see your screen live</p>
              </div>
            </button>
            <a
              href={USER_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-navy/5 text-navy shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">How-to guide</p>
                <p className="text-xs text-gray-500">Employer portal user guide (PDF)</p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-navy-light transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium">{open ? 'Close' : 'Help'}</span>
      </button>
    </div>
  )
}
