import { requireAdmin } from '@/lib/admin-auth'
import AnnouncementManager from '@/components/admin/AnnouncementManager'
import AdminProfileForm from '@/components/admin/AdminProfileForm'
import AdminSettingsActions from '@/components/admin/AdminSettingsActions'

export default async function AdminSettingsPage() {
  const admin = await requireAdmin()

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="font-heading text-2xl text-navy">Settings</h1>

      {/* Announcements */}
      <AnnouncementManager />

      {/* Profile */}
      <AdminProfileForm
        initialName={admin.name || ''}
        initialEmail={admin.email || ''}
        role={admin.role || 'admin'}
      />

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-700">Notifications</h2>
        <p className="text-sm text-gray-500">
          Email notification preferences are configured per client. Go to <strong>Clients → [Client Name] → Settings</strong> to manage notification preferences for each audience (PCG Admin, Client, Candidate).
        </p>
      </div>

      {/* Data Export + Log Out */}
      <AdminSettingsActions />
    </div>
  )
}
