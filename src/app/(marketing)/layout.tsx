import Link from 'next/link'
import '../portal/globals.css'

const nav = [
  { label: 'Industries', href: '/#industries' },
  { label: 'Build a Package', href: '/build-your-package' },
  { label: 'Add-Ons', href: '/add-ons' },
  { label: 'FAQ', href: '/faq' },
]

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-root">
      <header className="bg-gold sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/Copy_of_PCG_Logo_with_Soft_Typography.png"
              alt="PCG Screening"
              className="w-12 h-12 rounded-lg object-contain"
            />
            <div>
              <p className="font-heading text-navy text-lg leading-tight">PCG Screening</p>
              <p className="text-[10px] uppercase tracking-widest text-navy/70">Trusted since 2003</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-navy hover:text-navy-light font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/portal/login"
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-navy border border-navy/20 hover:bg-navy/5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/get-started"
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-navy text-white hover:bg-navy-light transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="bg-navy text-white/80 mt-16">
        <div className="max-w-6xl mx-auto px-5 py-10 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/Copy_of_PCG_Logo_with_Soft_Typography.png"
                alt="PCG Screening"
                className="w-10 h-10 rounded-lg object-contain bg-white/90 p-1"
              />
              <p className="font-heading text-white text-base">PCG Screening</p>
            </div>
            <p className="text-xs leading-relaxed">
              FCRA certified background screening. BBB A+ rated. Trusted since 2003.
            </p>
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-3">Solutions</p>
            <ul className="space-y-2 text-xs">
              <li><Link href="/industries/logistics" className="hover:text-gold transition-colors">Logistics & Transportation</Link></li>
              <li><Link href="/industries/healthcare" className="hover:text-gold transition-colors">Healthcare</Link></li>
              <li><Link href="/industries/home-health" className="hover:text-gold transition-colors">Home Health</Link></li>
              <li><Link href="/industries/general-hiring" className="hover:text-gold transition-colors">General Hiring</Link></li>
              <li><Link href="/industries/high-risk-executive" className="hover:text-gold transition-colors">Executive Screening</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-3">Resources</p>
            <ul className="space-y-2 text-xs">
              <li><Link href="/add-ons" className="hover:text-gold transition-colors">Add-On Catalog</Link></li>
              <li><Link href="/faq" className="hover:text-gold transition-colors">FAQ</Link></li>
              <li><Link href="/portal/login" className="hover:text-gold transition-colors">Employer Login</Link></li>
              <li><Link href="/apply/pcg-demo" className="hover:text-gold transition-colors">Run a Screen</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-3">Contact</p>
            <ul className="space-y-2 text-xs">
              <li>accounts@pcgscreening.com</li>
              <li>www.pcgscreening.net</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-5 py-4 text-[11px] text-white/50 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} PCG Screening Services. All rights reserved.</p>
            <p>FCRA Certified · BBB A+ Rated</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export const metadata = {
  title: 'PCG Screening — FCRA Certified Background Checks',
  description: 'Fast, accurate background screening for logistics, healthcare, home health, and executive hiring. FCRA certified. BBB A+. Trusted since 2003.',
}
