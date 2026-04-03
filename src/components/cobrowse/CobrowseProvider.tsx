'use client'

import { createContext, useContext } from 'react'
import { useCobrowseSession, type SessionState } from './useCobrowseSession'

interface CobrowseContextType {
  state: SessionState
  sessionId: string | null
  controlEnabled: boolean
  controlRequested: boolean
  requestHelp: () => Promise<void>
  endSession: () => Promise<void>
  allowControl: () => Promise<void>
  denyControl: () => void
  revokeControl: () => Promise<void>
}

const CobrowseContext = createContext<CobrowseContextType | null>(null)

export function useCobrowse() {
  const ctx = useContext(CobrowseContext)
  if (!ctx) throw new Error('useCobrowse must be used within CobrowseProvider')
  return ctx
}

export default function CobrowseProvider({ children }: { children: React.ReactNode }) {
  const session = useCobrowseSession()

  return (
    <CobrowseContext.Provider value={session}>
      {children}
    </CobrowseContext.Provider>
  )
}
