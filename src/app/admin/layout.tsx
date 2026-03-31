import '../portal/globals.css'
import { getAdminUser } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = {
  title: 'PCG Admin Dashboard',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser()

  // Login page renders without chrome (middleware handles redirect for protected routes)
  if (!admin) {
    return <>{children}</>
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
