import Link from 'next/link'

const categories = [
  {
    title: 'Criminal & Court Records',
    items: [
      { name: 'County Criminal (per county)', price: '$12' },
      { name: 'Statewide Criminal', price: '$18' },
      { name: 'Federal Criminal (district)', price: '$20' },
      { name: 'National Criminal Database', price: '$9' },
      { name: 'Sex Offender Registry', price: '$5' },
      { name: 'International Criminal', price: 'Quote' },
    ],
  },
  {
    title: 'Verifications',
    items: [
      { name: 'Employment Verification (per employer)', price: '$18' },
      { name: 'Education Verification (per degree)', price: '$18' },
      { name: 'Professional License Verification', price: '$15' },
      { name: 'Personal / Professional References', price: '$18' },
    ],
  },
  {
    title: 'Driver & DOT',
    items: [
      { name: '7-Year MVR (Motor Vehicle Report)', price: '$15' },
      { name: 'CDLIS Query', price: '$12' },
      { name: 'PSP (Pre-Employment Screening)', price: '$16' },
      { name: 'FMCSA Clearinghouse Query', price: '$15' },
    ],
  },
  {
    title: 'Healthcare & Sanctions',
    items: [
      { name: 'OIG / LEIE Exclusion', price: '$6' },
      { name: 'SAM Federal Exclusion', price: '$6' },
      { name: 'State Medicaid Sanctions', price: '$9' },
      { name: 'Adult & Child Abuse Registry', price: 'Varies' },
      { name: 'NPDB Query', price: '$20' },
    ],
  },
  {
    title: 'Financial',
    items: [
      { name: 'Credit Report (FCRA-compliant)', price: '$14' },
      { name: 'Bankruptcy, Lien & Judgment', price: '$12' },
      { name: 'Global Sanctions & PEP', price: '$9' },
    ],
  },
  {
    title: 'Drug & Health Screening',
    items: [
      { name: '5-Panel Urine Drug Screen', price: '$42' },
      { name: '10-Panel Urine Drug Screen', price: '$55' },
      { name: 'DOT Drug Screen', price: '$45' },
      { name: 'TB Test Coordination', price: 'Quote' },
    ],
  },
]

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || '/portal/login'

export default function AddOnsPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-gold-pale to-off-white">
        <div className="max-w-6xl mx-auto px-5 pt-14 pb-14 text-center">
          <p className="text-xs uppercase tracking-widest text-gold font-medium mb-3">Add-On Catalog</p>
          <h1 className="font-heading text-navy text-4xl md:text-5xl mb-4">Build Your Perfect Package</h1>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Start from an industry package or build à la carte. All prices shown are per candidate, billed only when a check runs.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-heading text-navy text-lg mb-4 pb-3 border-b border-gray-100">{cat.title}</h2>
              <ul className="space-y-3">
                {cat.items.map((item) => (
                  <li key={item.name} className="flex justify-between items-center gap-3 text-sm">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-navy font-medium shrink-0">{item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-500 mt-10">
          Prices subject to change. Court filing fees and access surcharges may apply in certain jurisdictions.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="bg-navy rounded-3xl px-8 py-14 text-center text-white">
          <h2 className="font-heading text-3xl mb-3">Need Help Building a Package?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-7">
            Our team will recommend the right checks for each role in your organization.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy font-medium hover:bg-gold-light transition-colors"
            >
              Schedule a Setup Call
            </a>
            <Link
              href="/apply/individuals"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Run a Sample Screen
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export const metadata = {
  title: 'Add-On Catalog — PCG Screening',
  description: 'Full list of background screening add-ons: criminal, verifications, DOT, healthcare sanctions, credit, and drug testing.',
}
