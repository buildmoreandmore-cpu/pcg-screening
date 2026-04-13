'use client'

export default function PrintButton() {
  return (
    <>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-light transition-colors no-print"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print / Save as PDF
      </button>
      <style jsx global>{`
        @media print {
          .no-print, nav, header, aside, footer,
          [class*="BottomNav"], [class*="Sidebar"], [class*="MobileHeader"],
          [class*="RequestHelp"], [class*="Announcement"] {
            display: none !important;
          }
          main { margin: 0 !important; padding: 0 !important; }
          .guide-content { box-shadow: none !important; border: none !important; padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </>
  )
}
