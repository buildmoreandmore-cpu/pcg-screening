'use client'

import { useCobrowse } from './CobrowseProvider'

export default function RequestHelpButton() {
  const { state, requestHelp } = useCobrowse()

  // Don't show when session is active or ended
  if (state === 'active' || state === 'ended') return null

  return (
    <button
      onClick={requestHelp}
      disabled={state === 'pending'}
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-navy-light transition-all disabled:opacity-70"
    >
      {state === 'pending' ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">Waiting for admin...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Get Help</span>
        </>
      )}
    </button>
  )
}
