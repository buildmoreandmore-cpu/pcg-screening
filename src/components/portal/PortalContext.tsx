'use client'

import { createContext, useContext, type ReactNode } from 'react'

type Client = {
  id: string
  slug: string
  name: string
  logo_url: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  packages: Array<{ name: string; price: number; description?: string; features?: string[] }>
  notification_email: string | null
  fcra_accepted_at: string | null
  active: boolean
}

type ClientUser = {
  id: string
  client_id: string
  email: string
  name: string
  role: 'admin' | 'user'
  active: boolean
  client: Client
}

type PortalContextType = {
  user: ClientUser
  client: Client
}

const PortalContext = createContext<PortalContextType | null>(null)

export function PortalProvider({ user, children }: { user: ClientUser; children: ReactNode }) {
  return (
    <PortalContext.Provider value={{ user, client: user.client }}>
      {children}
    </PortalContext.Provider>
  )
}

export function usePortal() {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error('usePortal must be used within PortalProvider')
  return ctx
}
