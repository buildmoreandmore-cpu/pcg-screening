import { redirect } from 'next/navigation'
import { getClientUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { PortalProvider } from '@/components/portal/PortalContext'
import Sidebar from '@/components/portal/Sidebar'
import MobileHeader from '@/components/portal/MobileHeader'
import BottomNav from '@/components/portal/BottomNav'
import FcraModal from '@/components/portal/FcraModal'
import ReferralSourceModal from '@/components/portal/ReferralSourceModal'
import AnnouncementBanner from '@/components/portal/AnnouncementBanner'
import CobrowseProvider from '@/components/cobrowse/CobrowseProvider'
import RequestHelpButton from '@/components/cobrowse/RequestHelpButton'
import CobrowseOverlay from '@/components/cobrowse/CobrowseOverlay'

async function getActiveAnnouncement() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('announcements')
    .select('id, message, type')
    .eq('active', true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const clientUser = await getClientUser()

  if (!clientUser) {
    redirect('/portal/login')
  }

  const announcement = await getActiveAnnouncement()

  return (
    <PortalProvider user={clientUser}>
      <CobrowseProvider>
        <div className="portal-root">
          {!clientUser.client.fcra_accepted_at && <FcraModal />}
          {clientUser.client.fcra_accepted_at && !clientUser.client.referral_source && (
            <ReferralSourceModal />
          )}
          <CobrowseOverlay />
          <MobileHeader />
          <Sidebar />
          <main className="lg:ml-56 min-h-dvh pb-20 lg:pb-0 pt-14 lg:pt-0">
            <AnnouncementBanner announcement={announcement} />
            <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
          <BottomNav />
          <RequestHelpButton />
        </div>
      </CobrowseProvider>
    </PortalProvider>
  )
}
