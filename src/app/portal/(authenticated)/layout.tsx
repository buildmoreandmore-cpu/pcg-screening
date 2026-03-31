import { redirect } from 'next/navigation'
import { getClientUser } from '@/lib/auth'
import { PortalProvider } from '@/components/portal/PortalContext'
import Sidebar from '@/components/portal/Sidebar'
import BottomNav from '@/components/portal/BottomNav'
import FcraModal from '@/components/portal/FcraModal'

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const clientUser = await getClientUser()

  if (!clientUser) {
    redirect('/portal/login')
  }

  return (
    <PortalProvider user={clientUser}>
      <div className="portal-root">
        {!clientUser.client.fcra_accepted_at && <FcraModal />}
        <Sidebar />
        <main className="lg:ml-56 min-h-dvh pb-20 lg:pb-0">
          <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </PortalProvider>
  )
}
