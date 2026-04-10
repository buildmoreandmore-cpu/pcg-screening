import Link from 'next/link'

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || '/portal/login'

type Industry = {
  title: string
  tagline: string
  bulletsLabel: string
  bullets: string[]
  footer?: string
  iconPath: string
}

const industries: Industry[] = [
  {
    title: 'For Logistics & Transportation Teams',
    tagline: 'Hire drivers faster without compliance risk.',
    bulletsLabel: 'What you can run:',
    bullets: [
      'MVR Reports & Monitoring',
      'DOT Drug & Alcohol Testing',
      'County + Federal Criminal Searches',
      'CDLIS & Driver History',
    ],
    footer: 'Built for high-volume, fast turnaround onboarding',
    iconPath:
      'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  },
  {
    title: 'For Healthcare & Staffing Agencies',
    tagline: 'Stay compliant without slowing down placements.',
    bulletsLabel: 'Includes:',
    bullets: [
      'OIG + SAM Exclusion Checks',
      'License Verification',
      'FACIS Screening',
      'Criminal Searches (County + Federal)',
      'NPDB',
    ],
    footer: 'One submission. One complete report.',
    iconPath: 'M12 4v16m8-8H4',
  },
  {
    title: 'For Home Health & Care Providers',
    tagline: 'Protect your clients and your reputation.',
    bulletsLabel: 'Essential checks:',
    bullets: [
      'National Criminal Background Screening',
      'Sex Offender Registry',
      'Drug Testing',
      'License verification (requires the license #)',
    ],
    footer: 'Fast screening for high-trust roles',
    iconPath:
      'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    title: 'For General Hiring',
    tagline: 'Simple, compliant screening for any role.',
    bulletsLabel: 'Choose from:',
    bullets: [
      'National Criminal Background Checks',
      'Employment Verification',
      'Education Verification',
      'Credit Report',
    ],
    iconPath:
      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    title: 'For High-Risk or Executive Roles',
    tagline: 'Go beyond basic screening.',
    bulletsLabel: 'Enhanced checks:',
    bullets: [
      'Credit Reports',
      'Civil Records',
      'Global Watchlists',
      'Deep Verifications',
    ],
    iconPath:
      'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
]

const addOns = [
  'Drug Testing (Urine, Hair, Oral Fluid)',
  'Ongoing Monitoring (Criminal, MVR, Sanctions)',
  'MVR Reports',
  'Identity Verification',
]

export default function BuildYourPackagePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gold-pale to-off-white">
        <div className="max-w-5xl mx-auto px-5 pt-14 pb-14 text-center">
          <p className="text-xs uppercase tracking-widest text-gold font-medium mb-3">
            Build a Package
          </p>
          <h1 className="font-heading text-navy text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight">
            Build Your Screening Package
          </h1>
          <p className="text-base md:text-lg text-navy/80 font-medium mb-6">
            Fast, Flexible Screening Built for Your Industry
          </p>
          <div className="max-w-2xl mx-auto space-y-3 text-gray-700 leading-relaxed">
            <p>
              Stop piecing together background checks from multiple vendors. PCG gives you one
              streamlined system to select, submit, and track everything in one place.
            </p>
            <p>Choose only what you need—or let us build it for you.</p>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="max-w-5xl mx-auto px-5 py-14">
        <div className="space-y-5">
          {industries.map((ind) => (
            <div
              key={ind.title}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-gold p-6 md:p-7"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-gold-pale flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-navy"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d={ind.iconPath}
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading text-navy text-xl md:text-2xl mb-1">{ind.title}</h2>
                  <p className="text-sm text-gray-600 mb-4">{ind.tagline}</p>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
                    {ind.bulletsLabel}
                  </p>
                  <ul className="space-y-1.5 mb-4">
                    {ind.bullets.map((b) => (
                      <li key={b} className="flex gap-2 text-sm text-gray-700">
                        <svg
                          className="w-4 h-4 text-gold shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                  {ind.footer && (
                    <p className="text-xs text-navy/70 font-medium border-t border-gray-100 pt-3 flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5 text-gold"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      {ind.footer}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add-Ons */}
      <section className="max-w-5xl mx-auto px-5 pb-14">
        <div className="bg-white rounded-2xl shadow-sm border border-gold/30 p-6 md:p-7">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gold flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v8m-4-4h8m5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-navy text-xl md:text-2xl mb-3">Add-On Services</h2>
              <ul className="space-y-1.5 mb-4">
                {addOns.map((a) => (
                  <li key={a} className="flex gap-2 text-sm text-gray-700">
                    <svg
                      className="w-4 h-4 text-gold shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {a}
                  </li>
                ))}
              </ul>
              <Link
                href="/add-ons"
                className="inline-flex items-center gap-1 text-sm text-gold hover:text-navy font-medium transition-colors"
              >
                See full add-on catalog
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div className="bg-navy rounded-3xl px-8 py-14 text-center text-white">
          <h2 className="font-heading text-3xl md:text-4xl mb-3">Ready to Build Yours?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-7">
            Three ways to get started — pick whichever fits where you are right now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/apply/pcg-demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy font-medium hover:bg-gold-light transition-colors"
            >
              Run Your First Screen
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <Link
              href="/portal/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Build Your Package
            </Link>
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Schedule a Setup Call
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

export const metadata = {
  title: 'Build Your Screening Package — PCG Screening',
  description:
    'Stop piecing together background checks from multiple vendors. PCG gives you one streamlined system to select, submit, and track everything in one place.',
}
