'use client'

import { useState, useEffect } from 'react'

interface Announcement {
  id: string
  message: string
  type: 'info' | 'warning' | 'urgent'
}

const styles = {
  info: 'bg-navy text-white',
  warning: 'bg-amber-500 text-navy',
  urgent: 'bg-red-600 text-white',
}

const icons = {
  info: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  urgent: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export default function AnnouncementBanner({ announcement }: { announcement: Announcement | null }) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (announcement) {
      const key = `announcement-dismissed-${announcement.id}`
      setDismissed(sessionStorage.getItem(key) === 'true')
    }
  }, [announcement])

  if (!announcement || dismissed) return null

  function handleDismiss() {
    sessionStorage.setItem(`announcement-dismissed-${announcement!.id}`, 'true')
    setDismissed(true)
  }

  return (
    <div className={`${styles[announcement.type]} px-4 py-2.5 flex items-center gap-3 text-sm`}>
      {icons[announcement.type]}
      <p className="flex-1 min-w-0">{announcement.message}</p>
      <button onClick={handleDismiss} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity" aria-label="Dismiss">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
