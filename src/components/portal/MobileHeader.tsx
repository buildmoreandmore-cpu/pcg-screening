'use client'

import Link from 'next/link'
import { usePortal } from './PortalContext'

export default function MobileHeader() {
  const { client } = usePortal()

  return (
    <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-navy z-30 flex items-center justify-between px-4 border-b border-white/10">
      <Link href="/" aria-label="Back to home">
        <img
          src="/Copy_of_PCG_Logo_with_Soft_Typography.png"
          alt="PCG Screening"
          className="h-10 object-contain"
        />
      </Link>
      <p className="text-white/80 text-xs font-medium truncate max-w-[55%]">{client.name}</p>
    </header>
  )
}
