'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePortal } from './PortalContext'
import { signOut } from '@/app/portal/actions/auth'

const primaryNav = [
  {
    label: 'Dashboard',
    href: '/portal/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Candidates',
    href: '/portal/candidates',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Invite',
    href: '/portal/invite',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    primary: true,
  },
]

const secondaryNav = [
  {
    label: 'Team',
    href: '/portal/team',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Resources',
    href: '/portal/resources',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/portal/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { client, user } = usePortal()

  function isActive(href: string) {
    if (href === '/portal/dashboard') return pathname === '/portal/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-navy min-h-dvh fixed left-0 top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10 flex justify-center">
        <Link href="/" className="inline-block bg-white/90 rounded-xl px-3 py-2" aria-label="Back to home">
          <img
            src="/Copy_of_PCG_Logo_with_Soft_Typography.png"
            alt="PCG Screening"
            className="h-16 object-contain"
          />
        </Link>
      </div>

      {/* Company */}
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-white/60 text-xs uppercase tracking-wider">Client</p>
        <p className="text-white text-sm font-medium truncate">{client.name}</p>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {primaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-white/15 text-white'
                : item.primary
                  ? 'text-gold hover:bg-white/10'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Secondary Nav */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        {secondaryNav
          .filter(item => item.href !== '/portal/team' || user.role === 'admin')
          .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(item.href)
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      {/* User */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-white text-sm truncate">{user.name}</p>
        <p className="text-white/40 text-xs truncate">{user.email}</p>
        <button
          onClick={() => signOut()}
          className="mt-2 flex items-center gap-2 text-white/40 hover:text-red-400 text-xs transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>
    </aside>
  )
}
