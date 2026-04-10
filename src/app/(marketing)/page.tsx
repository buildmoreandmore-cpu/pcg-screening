import Link from 'next/link'

const industries = [
  {
    slug: 'logistics',
    title: 'Logistics & Transportation',
    blurb: 'DOT-compliant MVR, drug screening, and PSP for drivers and warehouse hires.',
  },
  {
    slug: 'healthcare',
    title: 'Healthcare',
    blurb: 'OIG, SAM, and license verification for clinical and admin staff.',
  },
  {
    slug: 'home-health',
    title: 'Home Health & Care',
    blurb: 'Multi-state criminal, abuse registries, and elder-care compliance.',
  },
  {
    slug: 'general-hiring',
    title: 'General Hiring',
    blurb: 'Standard pre-employment packages built for any role, any budget.',
  },
  {
    slug: 'high-risk-executive',
    title: 'Executive & High-Risk',
    blurb: 'Civil litigation, global sanctions, and deep media research for senior hires.',
  },
]

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || '/portal/login'

export default function MarketingHome() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gold-pale to-off-white">
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-20 text-center">
          <p className="text-xs uppercase tracking-widest text-navy/70 font-medium mb-4">
            FCRA Certified · BBB A+ · Trusted Since 2003
          </p>
          <h1 className="font-heading text-navy text-4xl md:text-5xl lg:text-6xl leading-tight mb-5">
            Background Screening<br />Built for How You Hire
          </h1>
          <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto mb-8 leading-relaxed">
            Fast, accurate, and compliant background checks for logistics, healthcare,
            home health, and executive hiring. Run your first screen in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/apply/pcg-demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy text-white font-medium hover:bg-navy-light transition-colors shadow-md"
            >
              Run Your First Screen
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link
              href="/build-your-package"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-navy font-medium border border-navy/15 hover:border-navy/30 transition-colors"
            >
              Build Your Package
            </Link>
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-navy font-medium hover:bg-navy/5 transition-colors"
            >
              Schedule a Setup Call
            </a>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { stat: '20+', label: 'Years in Business' },
            { stat: 'A+', label: 'BBB Rating' },
            { stat: 'FCRA', label: 'Certified' },
            { stat: '< 24h', label: 'Avg Turnaround' },
          ].map((item) => (
            <div key={item.label}>
              <p className="font-heading text-navy text-3xl">{item.stat}</p>
              <p className="text-xs uppercase tracking-wider text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-gold font-medium mb-3">Industries We Serve</p>
          <h2 className="font-heading text-navy text-3xl md:text-4xl mb-3">Built for Your Industry</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pre-built packages tuned to the regulations and risks of your sector.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {industries.map((ind) => (
            <Link
              key={ind.slug}
              href={`/industries/${ind.slug}`}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-lg p-6 border border-gray-100 hover:border-gold/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-gold-pale flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-heading text-navy text-xl mb-2">{ind.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{ind.blurb}</p>
              <span className="inline-flex items-center gap-1 text-sm text-gold group-hover:text-navy font-medium transition-colors">
                Explore packages
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why PCG */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-gold font-medium mb-3">Why PCG</p>
            <h2 className="font-heading text-navy text-3xl md:text-4xl">Real People. Real Compliance.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'FCRA Compliant',
                body: 'Every report ships with adverse action workflows, candidate disclosure, and audit logs out of the box.',
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
              },
              {
                title: 'Live Human Researchers',
                body: 'Court runners and verification specialists in every state. No black-box automation, no missed records.',
                icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 0a4 4 0 10-8 0M21 8a4 4 0 11-8 0 4 4 0 018 0z',
              },
              {
                title: 'Built for Your Stack',
                body: 'Self-serve portal, branded candidate links, ATS-friendly exports, and net-30 invoicing for established employers.',
                icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
              },
            ].map((f) => (
              <div key={f.title}>
                <div className="w-12 h-12 rounded-xl bg-navy text-white flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon} />
                  </svg>
                </div>
                <h3 className="font-heading text-navy text-xl mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="bg-navy rounded-3xl px-8 py-16 text-center text-white">
          <h2 className="font-heading text-3xl md:text-4xl mb-4">Ready to Run Your First Screen?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Most employers are live and pulling reports the same day. No setup fees, no contracts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/apply/pcg-demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy font-medium hover:bg-gold-light transition-colors"
            >
              Run Your First Screen
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
