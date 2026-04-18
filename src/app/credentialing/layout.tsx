import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Physician Credentialing | MedCare Staffing',
  description: 'Submit your credentialing application for locum tenens assignments with MedCare Staffing.',
}

export default function CredentialingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FBFF] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* MedCare text logo - "MEDcare" bold blue with "STAFFING" in blue banner */}
            <div>
              <div className="text-2xl font-extrabold tracking-tight" style={{ color: '#2C5F8A' }}>
                <span style={{ color: '#4A90D9' }}>MED</span>care
              </div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-white bg-[#4A90D9] px-2 py-0.5 text-center rounded-sm -mt-0.5">
                STAFFING
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-gray-200" />
            <p className="hidden sm:block text-sm text-gray-600 font-medium">Physician Credentialing Application</p>
          </div>
          <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
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
