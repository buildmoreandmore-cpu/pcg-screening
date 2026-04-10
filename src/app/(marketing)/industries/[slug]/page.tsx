import Link from 'next/link'
import { notFound } from 'next/navigation'

type Industry = {
  title: string
  tagline: string
  hero: string
  pains: string[]
  package: { name: string; price: string; includes: string[] }
  recommendedAddOns: string[]
}

const industries: Record<string, Industry> = {
  logistics: {
    title: 'Logistics & Transportation',
    tagline: 'DOT-Compliant Driver Screening',
    hero: 'Hire road-ready drivers, warehouse staff, and dispatchers without a paperwork bottleneck. Built around DOT 49 CFR Part 391, FMCSA, and PSP requirements.',
    pains: [
      'Driver shortage means every day a candidate sits in onboarding costs revenue.',
      'DOT roadside audits demand a clean, retrievable Driver Qualification File for every hire.',
      'PSP and Clearinghouse queries require careful consent capture and storage.',
      'Multi-state criminal histories slip through national-database-only checks.',
    ],
    package: {
      name: 'Driver Pro Package',
      price: '$74',
      includes: [
        'SSN trace + address history',
        'National criminal database',
        'County criminal (current + 2 prior)',
        '7-year MVR (motor vehicle report)',
        'Employment verification (DOT 3-year)',
        'PSP (Pre-Employment Screening Program)',
      ],
    },
    recommendedAddOns: ['DOT Drug Screen (5-panel)', 'Clearinghouse Query', 'CDL Verification'],
  },
  healthcare: {
    title: 'Healthcare',
    tagline: 'Clinical & Admin Hiring, Done Right',
    hero: 'OIG, SAM, and state license verification on every clinical hire — alongside the criminal and employment depth your compliance officer expects.',
    pains: [
      'Excluded providers create immediate Medicare/Medicaid billing risk.',
      'License lapses and disciplinary actions vary state-by-state and change weekly.',
      'Clinical hiring volume spikes faster than your screening vendor can scale.',
      'Sanctions hits need to surface before the offer letter, not after.',
    ],
    package: {
      name: 'Clinical Compliance Package',
      price: '$89',
      includes: [
        'SSN trace + address history',
        'National + county criminal',
        'OIG/LEIE exclusion check',
        'SAM federal exclusion list',
        'State Medicaid sanctions',
        'Primary-source license verification',
      ],
    },
    recommendedAddOns: ['Education Verification', 'NPDB Query', 'Pre-Employment Drug Screen'],
  },
  'home-health': {
    title: 'Home Health & Care',
    tagline: 'Protecting the Vulnerable',
    hero: 'Multi-state criminal, abuse registries, and elder-care compliance for caregivers entering homes. Built for agencies serving Medicare, Medicaid, and private-pay clients.',
    pains: [
      'Caregivers cross county and state lines — single-state checks miss real risk.',
      'State abuse registries are not in any national database; each must be queried directly.',
      'High turnover means rapid rehires and re-checks at scale.',
      'Documentation must satisfy state surveyors on demand.',
    ],
    package: {
      name: 'Caregiver Trust Package',
      price: '$79',
      includes: [
        'SSN trace + 7-year address history',
        'Multi-state criminal database',
        'County criminal (all reported addresses)',
        'Adult & child abuse registry checks',
        'OIG/SAM exclusions',
        'Sex offender registry (national)',
      ],
    },
    recommendedAddOns: ['Driving Record (MVR)', 'Reference Checks', 'TB / Drug Screen Coordination'],
  },
  'general-hiring': {
    title: 'General Hiring',
    tagline: 'A Package for Every Role',
    hero: 'Flexible pre-employment screening that scales from your first hire to your hundredth. Pay per check, set a default package per role, or build à la carte.',
    pains: [
      'One-size-fits-all packages waste money on roles that don\'t need them.',
      'Hiring managers want speed; HR needs documentation; finance wants predictability.',
      'You need a vendor that won\'t disappear when your volume is small.',
      'Onboarding paperwork should be fast for the candidate, not just for you.',
    ],
    package: {
      name: 'Standard Package',
      price: '$49',
      includes: [
        'SSN trace + address history',
        'National criminal database',
        'County criminal (current address)',
        'Sex offender registry',
        'Global watchlist',
      ],
    },
    recommendedAddOns: ['Employment Verification', 'Education Verification', 'Credit (FCRA-compliant)'],
  },
  'high-risk-executive': {
    title: 'Executive & High-Risk',
    tagline: 'Deep Diligence for Senior Hires',
    hero: 'C-suite and board-level hires deserve more than a database hit. Civil litigation, federal court, global sanctions, and curated media research — delivered as a written narrative.',
    pains: [
      'Boards expect documented diligence; "we ran a background check" is no longer enough.',
      'Civil litigation and federal records often hold the real story, not county criminal.',
      'International exposure requires global sanctions and PEP screening.',
      'Reputational research must be defensible, sourced, and FCRA-aware.',
    ],
    package: {
      name: 'Executive Diligence Package',
      price: '$349',
      includes: [
        'Federal + civil court (7-year)',
        '10-year county criminal (all addresses)',
        'Global sanctions, PEP & watchlists',
        'Bankruptcy, lien & judgment search',
        'Professional license verification',
        'Adverse media & reputation summary',
      ],
    },
    recommendedAddOns: ['Credit Report (FCRA)', 'Education Verification (all degrees)', 'International Criminal'],
  },
}

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || '/portal/login'

export function generateStaticParams() {
  return Object.keys(industries).map((slug) => ({ slug }))
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = industries[slug]
  if (!data) notFound()

  return (
    <>
      <section className="bg-gradient-to-b from-gold-pale to-off-white">
        <div className="max-w-5xl mx-auto px-5 pt-14 pb-16">
          <Link href="/#industries" className="inline-flex items-center gap-1 text-sm text-navy/60 hover:text-navy mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" /></svg>
            All Industries
          </Link>
          <p className="text-xs uppercase tracking-widest text-gold font-medium mb-3">{data.tagline}</p>
          <h1 className="font-heading text-navy text-4xl md:text-5xl mb-5 leading-tight">{data.title}</h1>
          <p className="text-base md:text-lg text-gray-700 max-w-3xl leading-relaxed mb-8">{data.hero}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/apply/pcg-demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy text-white font-medium hover:bg-navy-light transition-colors shadow-md"
            >
              Run Your First Screen
            </Link>
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-navy font-medium border border-navy/15 hover:border-navy/30 transition-colors"
            >
              Schedule a Setup Call
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold font-medium mb-3">What You're Up Against</p>
            <h2 className="font-heading text-navy text-2xl mb-5">Common Pain Points</h2>
            <ul className="space-y-4">
              {data.pains.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold-pale flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{p}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-7 border border-gray-100">
            <p className="text-xs uppercase tracking-widest text-gold font-medium mb-2">Recommended Package</p>
            <h3 className="font-heading text-navy text-2xl mb-1">{data.package.name}</h3>
            <p className="text-3xl text-navy font-medium mb-5">{data.package.price}<span className="text-sm text-gray-500 font-normal"> / candidate</span></p>
            <ul className="space-y-2.5 mb-6">
              {data.package.includes.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-gold shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-100 pt-4 mb-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Recommended Add-Ons</p>
              <div className="flex flex-wrap gap-2">
                {data.recommendedAddOns.map((addon) => (
                  <span key={addon} className="text-xs px-2.5 py-1 rounded-full bg-gold-pale text-navy">{addon}</span>
                ))}
              </div>
            </div>
            <Link
              href="/apply/pcg-demo"
              className="block w-full text-center px-4 py-3 rounded-xl bg-navy text-white font-medium hover:bg-navy-light transition-colors"
            >
              Start Screening
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-5 py-16 text-center">
          <h2 className="font-heading text-3xl mb-3">Not sure which package fits?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-7">
            A 15-minute call with our team is the fastest way to map your roles to the right checks.
          </p>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy font-medium hover:bg-gold-light transition-colors"
          >
            Schedule a Setup Call
          </a>
        </div>
      </section>
    </>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = industries[slug]
  if (!data) return { title: 'Industry — PCG Screening' }
  return {
    title: `${data.title} — PCG Screening`,
    description: data.hero,
  }
}
