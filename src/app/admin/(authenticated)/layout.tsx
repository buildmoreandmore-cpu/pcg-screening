import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser()

  if (!admin) {
    redirect('/admin/login')
  }

  return (
    <div className="portal-root">
      <AdminSidebar adminName={admin.name} adminEmail={admin.email} />
      <main className="lg:ml-56 min-h-dvh pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
