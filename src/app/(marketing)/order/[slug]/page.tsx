import { notFound } from 'next/navigation'
import GuestOrderForm from './GuestOrderForm'

type PackageInfo = {
  slug: string
  name: string
  priceCents: number
  priceLabel: string
  includes: string[]
}

const PACKAGES: Record<string, PackageInfo> = {
  'driver-pro': {
    slug: 'driver-pro',
    name: 'Driver Pro Package',
    priceCents: 7400,
    priceLabel: '$74',
    includes: [
      'SSN trace + address history',
      'National criminal database',
      'County criminal (current + 2 prior)',
      '7-year MVR (motor vehicle report)',
      'Employment verification (DOT 3-year)',
      'PSP (Pre-Employment Screening Program)',
    ],
  },
  'clinical-compliance': {
    slug: 'clinical-compliance',
    name: 'Clinical Compliance Package',
    priceCents: 8900,
    priceLabel: '$89',
    includes: [
      'SSN trace + address history',
      'National + county criminal',
      'OIG/LEIE exclusion check',
      'SAM federal exclusion list',
      'State Medicaid sanctions',
      'Primary-source license verification',
    ],
  },
  'caregiver-trust': {
    slug: 'caregiver-trust',
    name: 'Caregiver Trust Package',
    priceCents: 7900,
    priceLabel: '$79',
    includes: [
      'SSN trace + 7-year address history',
      'Multi-state criminal database',
      'County criminal (all reported addresses)',
      'Adult & child abuse registry checks',
      'OIG/SAM exclusions',
      'Sex offender registry (national)',
    ],
  },
  standard: {
    slug: 'standard',
    name: 'Standard Package',
    priceCents: 4900,
    priceLabel: '$49',
    includes: [
      'SSN trace + address history',
      'National criminal database',
      'County criminal (current address)',
      'Sex offender registry',
      'Global watchlist',
    ],
  },
  'executive-diligence': {
    slug: 'executive-diligence',
    name: 'Executive Diligence Package',
    priceCents: 34900,
    priceLabel: '$349',
    includes: [
      'Federal + civil court (7-year)',
      '10-year county criminal (all addresses)',
      'Global sanctions, PEP & watchlists',
      'Bankruptcy, lien & judgment search',
      'Professional license verification',
      'Adverse media & reputation summary',
    ],
  },
  basic: {
    slug: 'basic',
    name: 'Basic Background Check',
    priceCents: 2900,
    priceLabel: '$29',
    includes: [
      'SSN trace',
      'National criminal database',
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(PACKAGES).map((slug) => ({ slug }))
}

export default async function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pkg = PACKAGES[slug]
  if (!pkg) notFound()

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <div className="grid md:grid-cols-5 gap-8">
        {/* Order summary — sticky sidebar */}
        <div className="md:col-span-2 md:order-2">
          <div className="sticky top-24 bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <p className="text-xs uppercase tracking-widest text-gold font-medium mb-2">Your Order</p>
            <h2 className="font-heading text-navy text-xl mb-1">{pkg.name}</h2>
            <p className="text-3xl text-navy font-medium mb-5">
              {pkg.priceLabel}<span className="text-sm text-gray-500 font-normal"> / candidate</span>
            </p>
            <ul className="space-y-2 mb-4">
              {pkg.includes.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-gold shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-heading text-navy text-lg">{pkg.priceLabel}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-3 md:order-1">
          <h1 className="font-heading text-navy text-2xl mb-1">Order a Screening</h1>
          <p className="text-sm text-gray-500 mb-6">
            Fill out the details below. After payment, we&apos;ll email your candidate a secure link
            to complete the consent form and provide their personal information.
          </p>
          <GuestOrderForm packageSlug={pkg.slug} packageName={pkg.name} priceCents={pkg.priceCents} />
        </div>
      </div>
    </div>
  )
}
