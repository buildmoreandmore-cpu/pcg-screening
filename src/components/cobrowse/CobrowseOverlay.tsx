'use client'

import { useCobrowse } from './CobrowseProvider'

export default function CobrowseOverlay() {
  const { state, controlEnabled, controlRequested, endSession, allowControl, denyControl, revokeControl } = useCobrowse()

  if (state !== 'pending' && state !== 'active') return null

  return (
    <>
      {/* Top banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-navy text-white">
        <div className="flex items-center justify-between px-4 py-2 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${state === 'active' ? 'bg-green-400 animate-ping' : 'bg-yellow-400 animate-ping'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${state === 'active' ? 'bg-green-400' : 'bg-yellow-400'}`} />
            </span>
            <span className="text-sm font-medium">
              {state === 'pending' && 'Requesting help — waiting for admin...'}
              {state === 'active' && !controlEnabled && 'An admin is viewing your screen'}
              {state === 'active' && controlEnabled && 'An admin is controlling your screen'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {controlEnabled && (
              <button
                onClick={revokeControl}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
              >
                Revoke Control
              </button>
            )}
            <button
              onClick={endSession}
              className="text-xs bg-red-500/80 hover:bg-red-500 px-3 py-1 rounded-full transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* Control request modal */}
      {controlRequested && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4 text-center">
            <div className="w-12 h-12 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 className="text-lg font-heading text-navy mb-1">Control Request</h3>
            <p className="text-sm text-gray-500 mb-4">
              The admin wants to click and navigate on your screen to help you. You can revoke this at any time.
            </p>
            <div className="flex gap-3">
              <button
                onClick={denyControl}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Deny
              </button>
              <button
                onClick={allowControl}
                className="flex-1 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-light transition-colors"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer to push content below the banner */}
      <div className="h-10" />
    </>
  )
}
