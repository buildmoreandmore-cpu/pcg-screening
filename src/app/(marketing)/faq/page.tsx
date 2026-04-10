import Link from 'next/link'
import FaqAccordion from './FaqAccordion'

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'How fast can I start running background checks?',
        a: 'Most employers are live and pulling their first report the same day they sign up. Self-pay candidates can complete a screen in as little as 10 minutes. Enterprise onboarding with net-30 billing typically takes 1–2 business days.',
      },
      {
        q: 'Do I need to sign a contract?',
        a: 'No. Pay-per-check employers can start immediately with no commitment. Net-30 invoiced accounts require a brief credit application and a mutual service agreement.',
      },
      {
        q: 'Is there a minimum volume?',
        a: 'No minimums. Run one check a year or one thousand a month — pricing and turnaround stay the same.',
      },
    ],
  },
  {
    category: 'Compliance & FCRA',
    items: [
      {
        q: 'Is PCG Screening FCRA compliant?',
        a: 'Yes. PCG Screening is an FCRA-certified Consumer Reporting Agency. Every workflow — disclosure, authorization, adverse action — is built to FCRA and applicable state laws (California ICRAA, New York Article 23-A, etc.).',
      },
      {
        q: 'Do you handle the adverse action process?',
        a: 'Yes. Our portal generates pre-adverse and adverse action letters with the correct dispute window, a copy of the report, and the Summary of Rights under the FCRA.',
      },
      {
        q: 'How long do you retain records?',
        a: 'Reports and signed disclosures are retained for five years from the date of the report, per FCRA guidance, and are available to you in the portal during that period.',
      },
    ],
  },
  {
    category: 'Packages & Pricing',
    items: [
      {
        q: 'What\'s the difference between your industry packages?',
        a: 'Each package is tuned to the regulations and risks of its sector. Logistics adds MVR and PSP; Healthcare adds OIG and license verification; Home Health adds abuse registries. See our Industries pages for the full breakdown.',
      },
      {
        q: 'Can I customize a package?',
        a: 'Absolutely. Start from an industry template, then add or remove individual checks in the portal. You can also save custom packages per role.',
      },
      {
        q: 'Are there any hidden fees?',
        a: 'No. Court access fees and third-party pass-through charges (e.g., state Medicaid queries) are itemized on every invoice. You always see what you\'re paying for.',
      },
    ],
  },
  {
    category: 'Turnaround & Accuracy',
    items: [
      {
        q: 'How long does a typical check take?',
        a: 'Database and instant checks return in minutes. County criminal and verifications average 24–48 hours. Complex federal or international cases can take 3–5 business days. You\'ll see live status in the portal.',
      },
      {
        q: 'What if a court is closed or slow?',
        a: 'Our team proactively follows up, and you see the delay reason in your portal. We do not mark a report "complete" until every check actually clears.',
      },
      {
        q: 'How do you handle disputes?',
        a: 'Candidates can dispute any finding directly through a secure link. Our compliance team reinvestigates within the FCRA-required 30-day window and issues a corrected report if needed.',
      },
    ],
  },
  {
    category: 'Candidate Experience',
    items: [
      {
        q: 'How does the candidate complete their part?',
        a: 'You (or we) send them a secure link. They enter their information, review and sign the FCRA disclosure, and submit — usually in under 10 minutes, on any device.',
      },
      {
        q: 'Is candidate data secure?',
        a: 'Yes. All PII is encrypted in transit and at rest. SSN is masked in the portal. Access is role-based and audit-logged.',
      },
      {
        q: 'Can candidates see their own report?',
        a: 'Yes. Candidates receive a copy upon request and automatically if any adverse action is contemplated, per FCRA.',
      },
    ],
  },
]

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || '/portal/login'

export default function FaqPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-gold-pale to-off-white">
        <div className="max-w-4xl mx-auto px-5 pt-14 pb-12 text-center">
          <p className="text-xs uppercase tracking-widest text-gold font-medium mb-3">Frequently Asked Questions</p>
          <h1 className="font-heading text-navy text-4xl md:text-5xl mb-4">Questions, Answered</h1>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Everything you need to know about running background checks with PCG. Still have questions? Book a 15-minute setup call.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 py-14">
        <FaqAccordion categories={faqs} />
      </section>

      <section className="max-w-4xl mx-auto px-5 pb-20">
        <div className="bg-navy rounded-3xl px-8 py-14 text-center text-white">
          <h2 className="font-heading text-3xl mb-3">Still Have Questions?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-7">
            A real person on our team will answer in minutes.
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
              Run Your First Screen
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export const metadata = {
  title: 'FAQ — PCG Screening',
  description: 'Answers to common questions about PCG Screening: FCRA compliance, turnaround, pricing, packages, and candidate experience.',
}
