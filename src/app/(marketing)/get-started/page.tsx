import GetStartedForm from './GetStartedForm'

export default function GetStartedPage({
  searchParams,
}: {
  searchParams: { type?: string }
}) {
  const initialType =
    searchParams.type === 'package' || searchParams.type === 'call' ? searchParams.type : 'screen'

  return (
    <>
      <section className="bg-gradient-to-b from-gold-pale to-off-white">
        <div className="max-w-3xl mx-auto px-5 pt-14 pb-10 text-center">
          <p className="text-xs uppercase tracking-widest text-gold font-medium mb-3">Get Started</p>
          <h1 className="font-heading text-navy text-4xl md:text-5xl leading-tight mb-4">
            Tell us what you need
          </h1>
          <p className="text-base md:text-lg text-gray-700 max-w-xl mx-auto leading-relaxed">
            One quick form. Gwen will email or call you back the same business day —
            usually within a couple of hours.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 pb-20 -mt-4">
        <GetStartedForm initialType={initialType as 'screen' | 'package' | 'call'} />
      </section>
    </>
  )
}

export const metadata = {
  title: 'Get Started — PCG Screening',
  description:
    'Request your first background screening, build a custom package, or schedule a setup call. PCG responds the same business day.',
}
