import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Physician Credentialing | MedCare Staffing',
  description: 'Submit your credentialing application for locum tenens assignments with MedCare Staffing.',
  icons: {
    icon: '/credentialing/favicon.svg',
  },
}

export default function CredentialingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FBFF] flex flex-col">
      {/* Header */}
      <header className="bg-[#3a3a3a] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* MedCare Staffing logo */}
            <div className="flex flex-col items-center">
              <div className="text-2xl font-extrabold tracking-tight leading-none">
                <span className="text-white">MED</span><span style={{ color: '#5BA4E6' }}>care</span>
              </div>
              <div className="relative mt-0.5 w-full flex justify-center">
                <div className="text-[9px] font-bold tracking-[0.25em] text-white px-3 py-[2px] text-center" style={{ background: '#5BA4E6', clipPath: 'polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)' }}>
                  STAFFING
                </div>
              </div>
              <div className="text-[7px] font-semibold tracking-[0.15em] text-gray-300 mt-0.5">
                A VETERAN OWNED BUSINESS
              </div>
            </div>
            <div className="hidden sm:block h-10 w-px bg-white/20" />
            <p className="hidden sm:block text-sm text-gray-300 font-medium">Physician Credentialing Application</p>
          </div>
          <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Secure
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium" style={{ color: '#2C5F8A' }}>MedCare Staffing</span>
              {' '}| Tom Harbin, President
            </div>
            <a href="tel:8884743380" className="hover:underline">888-474-3380</a>
            <a href="mailto:tharbin@medcarestaffing.com" className="hover:underline">tharbin@medcarestaffing.com</a>
          </div>
          <p className="text-xs text-gray-400">
            Credentialing managed by PCG Screening Services | 770-716-1278 | accounts@pcgscreening.com
          </p>
        </div>
      </footer>
    </div>
  )
}
