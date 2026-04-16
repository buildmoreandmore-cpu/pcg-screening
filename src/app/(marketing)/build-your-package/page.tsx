import Link from 'next/link'

type Package = {
  slug: string
  name: string
  price: string
  priceSub?: string
  tagline: string
  includes: string[]
  badge?: string
  iconPath: string
}

const packages: Package[] = [
  {
    slug: 'basic',
    name: 'Basic Background Check',
    price: '$29',
    tagline: 'Quick, affordable pre-employment screen.',
    includes: [
      'SSN trace',
      'National criminal database',
    ],
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    slug: 'standard',
    name: 'Standard Package',
    price: '$49',
    tagline: 'Our most popular — covers all the essentials.',
    badge: 'Most Popular',
    includes: [
      'SSN trace + address history',
      'National criminal database',
      'County criminal (current address)',
      'Sex offender registry',
      'Global watchlist',
    ],
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    slug: 'driver-pro',
    name: 'Driver Pro Package',
    price: '$74',
    tagline: 'DOT-compliant screening for drivers and fleet hires.',
    includes: [
      'SSN trace + address history',
      'National criminal database',
      'County criminal (current + 2 prior)',
      '7-year MVR (motor vehicle report)',
      'Employment verification (DOT 3-year)',
      'PSP (Pre-Employment Screening Program)',
    ],
    iconPath: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  },
  {
    slug: 'caregiver-trust',
    name: 'Caregiver Trust Package',
    price: '$79',
    tagline: 'Built for home health, elder care, and childcare providers.',
    includes: [
      'SSN trace + 7-year address history',
      'Multi-state criminal database',
      'County criminal (all reported addresses)',
      'Adult & child abuse registry checks',
      'OIG/SAM exclusions',
      'Sex offender registry (national)',
    ],
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    slug: 'clinical-compliance',
    name: 'Clinical Compliance Package',
    price: '$89',
    tagline: 'Full healthcare compliance — OIG, SAM, license verification.',
    includes: [
      'SSN trace + address history',
      'National + county criminal',
      'OIG/LEIE exclusion check',
      'SAM federal exclusion list',
      'State Medicaid sanctions',
      'Primary-source license verification',
    ],
    iconPath: 'M12 4v16m8-8H4',
  },
  {
    slug: 'executive-diligence',
    name: 'Executive Diligence Package',
    price: '$349',
    tagline: 'Deep-dive screening for senior, financial, and high-risk roles.',
    includes: [
      'Federal + civil court (7-year)',
      '10-year county criminal (all addresses)',
      'Global sanctions, PEP & watchlists',
      'Bankruptcy, lien & judgment search',
      'Professional license verification',
      'Adverse media & reputation summary',
    ],
    iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
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
            Self-Service Screening
          </p>
          <h1 className="font-heading text-navy text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight">
            Choose Your Package
          </h1>
          <p className="text-base md:text-lg text-navy/80 font-medium mb-3">
            Select a package, enter your candidate&apos;s info, and pay.
          </p>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            After payment, your candidate receives a secure link to complete the FCRA consent form
            and provide their personal details. Results delivered in 1–3 business days.
          </p>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="max-w-6xl mx-auto px-5 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <div
              key={pkg.slug}
              className={`relative bg-white rounded-2xl shadow-sm border p-5 sm:p-6 flex flex-col ${
                pkg.badge ? 'border-gold ring-1 ring-gold/20' : 'border-gray-100'
              }`}
            >
              {pkg.badge && (
                <span className="absolute -top-3 left-5 bg-gold text-navy text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  {pkg.badge}
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold-pale flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={pkg.iconPath} />
                  </svg>
                </div>
                <div>
                  <h2 className="font-heading text-navy text-lg leading-tight">{pkg.name}</h2>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{pkg.tagline}</p>
              <p className="text-3xl font-heading text-navy mb-1">
                {pkg.price}<span className="text-sm text-gray-500 font-normal"> / candidate</span>
              </p>
              <ul className="space-y-1.5 my-4 flex-1">
                {pkg.includes.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-gold shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={`/order/${pkg.slug}`}
                className={`mt-auto w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-colors ${
                  pkg.badge
                    ? 'bg-navy text-white hover:bg-navy-light'
                    : 'bg-gray-100 text-navy hover:bg-gray-200'
                }`}
              >
                Order Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Add-Ons */}
      <section className="max-w-5xl mx-auto px-5 pb-14">
        <div className="bg-white rounded-2xl shadow-sm border border-gold/30 p-6 md:p-7">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gold flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8m5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-navy text-xl md:text-2xl mb-1">Need Something Custom?</h2>
              <p className="text-sm text-gray-600 mb-3">
                Add individual services to any package, or let us build one from scratch.
              </p>
              <ul className="space-y-1.5 mb-4">
                {addOns.map((a) => (
                  <li key={a} className="flex gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-gold shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {a}
                  </li>
                ))}
              </ul>
              <Link
                href="/get-started?type=package"
                className="inline-flex items-center gap-1 text-sm text-gold hover:text-navy font-medium transition-colors"
              >
                Request a custom package
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-5 py-14">
          <h2 className="font-heading text-navy text-2xl md:text-3xl text-center mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Choose a Package', desc: 'Pick the package that fits your industry and role.' },
              { step: '2', title: 'Enter Candidate Info', desc: 'Tell us who to screen and pay securely via Stripe.' },
              { step: '3', title: 'Candidate Completes Form', desc: 'They receive a link to sign the FCRA consent and provide their details.' },
              { step: '4', title: 'Get Your Report', desc: 'Results delivered via email in 1–3 business days.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center mx-auto mb-3 font-heading text-lg">
                  {s.step}
                </div>
                <h3 className="font-heading text-navy text-base mb-1">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 py-14">
        <div className="bg-navy rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-10 sm:py-14 text-center text-white">
          <h2 className="font-heading text-3xl md:text-4xl mb-3">Need Volume Pricing?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-7">
            Set up an employer portal with net-30 billing, branded candidate links, and team access.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/get-started?type=package"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy font-medium hover:bg-gold-light transition-colors"
            >
              Set Up Employer Account
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/get-started?type=call"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Schedule a Call
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export const metadata = {
  title: 'Screening Packages — PCG Screening',
  description:
    'Choose a background screening package and order instantly. Pay per candidate, no contracts. Results in 1–3 business days.',
}
