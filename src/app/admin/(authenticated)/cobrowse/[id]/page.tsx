import { requireAdmin } from '@/lib/admin-auth'
import AdminCobrowseViewer from '@/components/cobrowse/AdminCobrowseViewer'

export default async function CobrowsePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  return (
    <div className="h-[calc(100dvh-2rem)]">
      <AdminCobrowseViewer sessionId={id} />
    </div>
  )
}
