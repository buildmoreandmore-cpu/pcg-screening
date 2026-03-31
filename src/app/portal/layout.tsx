import './globals.css'
import { headers } from 'next/headers'
import { getClientUser } from '@/lib/auth'
import { PortalProvider } from '@/components/portal/PortalContext'
import Sidebar from '@/components/portal/Sidebar'
import BottomNav from '@/components/portal/BottomNav'
import FcraModal from '@/components/portal/FcraModal'

export const metadata = {
  title: 'PCG Screening — Employer Portal',
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-nextjs-matched-path') || headersList.get('x-invoke-path') || ''

  // Login and auth callback pages render without auth/chrome
  const isPublicRoute = pathname.includes('/portal/login') || pathname.includes('/portal/auth')

  if (isPublicRoute) {
    return <>{children}</>
  }

  const clientUser = await getClientUser()

  // Not authenticated — render children without chrome (middleware handles redirect)
  if (!clientUser) {
    return <>{children}</>
  }

  return (
    <PortalProvider user={clientUser}>
      <div className="portal-root">
        {/* FCRA one-time acceptance */}
        {!clientUser.client.fcra_accepted_at && <FcraModal />}

        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="lg:ml-56 min-h-dvh pb-20 lg:pb-0">
          <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </PortalProvider>
  )
}
