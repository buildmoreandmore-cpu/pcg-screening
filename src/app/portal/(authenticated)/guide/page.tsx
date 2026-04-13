import PrintButton from './PrintButton'

export const metadata = {
  title: 'Employer Portal User Guide — PCG Screening',
}

export default function UserGuidePage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Print button — hidden in print */}
      <div className="flex items-center justify-between mb-6 no-print">
        <h1 className="font-heading text-navy text-2xl">Employer Portal User Guide</h1>
        <PrintButton />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-10 guide-content">
        {/* Print-only header */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-2xl font-bold">PCG Screening — Employer Portal User Guide</h1>
          <p className="text-sm text-gray-500 mt-1">www.pcgscreening.net</p>
        </div>

        <section>
          <p className="text-sm text-gray-600 leading-relaxed">
            Welcome to your PCG Screening employer portal. This guide covers everything you need to
            invite candidates, track screenings, manage your team, handle billing, and update your settings.
          </p>
        </section>

        <hr className="border-gray-100" />

        {/* Logging In */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Logging In</h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
            <li>Go to <strong>www.pcgscreening.net/portal/login</strong>.</li>
            <li>Enter your email address.</li>
            <li>Click <strong>Send Magic Link</strong>.</li>
            <li>Check your email and click the login link — no password needed.</li>
          </ol>
          <p className="text-sm text-gray-500 mt-3">
            The magic link expires after 24 hours. If it doesn&apos;t arrive, check your spam folder
            or contact PCG Screening.
          </p>
        </section>

        <hr className="border-gray-100" />

        {/* First Login */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">First Login</h2>
          <p className="text-sm text-gray-700 mb-2">
            The first time you log in, you&apos;ll be asked to:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
            <li><strong>Accept the FCRA compliance agreement</strong> — this is required before you can invite any candidates.</li>
            <li><strong>Tell us how you heard about PCG</strong> — a quick one-question survey.</li>
          </ol>
          <p className="text-sm text-gray-500 mt-2">
            These only appear once. After completing them, you go straight to your dashboard on future logins.
          </p>
        </section>

        <hr className="border-gray-100" />

        {/* Dashboard */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Dashboard</h2>
          <p className="text-sm text-gray-700 mb-3">
            Your dashboard shows a summary of your company&apos;s screening activity:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
            <li><strong>Total Candidates</strong> — everyone your company has submitted</li>
            <li><strong>In Progress</strong> — screenings currently being processed</li>
            <li><strong>Completed</strong> — finished screenings</li>
            <li><strong>Recent Candidates</strong> — the latest submissions with their current status</li>
          </ul>
          <p className="text-sm text-gray-500 mt-3">
            If you are a <strong>standard user</strong> (not an admin), you will only see candidates
            that you personally submitted. Company admins see all candidates across the organization.
          </p>
        </section>

        <hr className="border-gray-100" />

        {/* Inviting a Candidate */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Inviting a Candidate</h2>
          <p className="text-sm text-gray-700 mb-4">
            This is the main action you&apos;ll use day to day.
          </p>

          <h3 className="text-sm font-semibold text-navy mb-2">Using a Package</h3>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700 mb-5">
            <li>Click <strong>Invite</strong> in the sidebar (or bottom nav on mobile).</li>
            <li>Select one of your company&apos;s pre-configured screening packages. Each shows the package name, price, and included checks.</li>
            <li>Click <strong>Continue</strong>.</li>
            <li>Enter the candidate&apos;s first name, last name, and email address.</li>
            <li>Click <strong>Send Invite</strong>.</li>
          </ol>
          <p className="text-sm text-gray-500 mb-5">
            The candidate receives an email with a link to complete their FCRA consent form and provide personal information (SSN, address, date of birth, etc.). You do <strong>not</strong> need to collect this information yourself.
          </p>

          <h3 className="text-sm font-semibold text-navy mb-2">Using Custom Screening (A La Carte)</h3>
          <p className="text-sm text-gray-700 mb-2">
            If none of the standard packages fit, use the <strong>Custom Screening</strong> option:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700 mb-5">
            <li>On the Invite page, click the gold <strong>Custom Screening</strong> banner at the bottom.</li>
            <li>Pick the individual checks you need — criminal, employment verification, education, drug testing, and more.</li>
            <li>A summary of your selections appears as you choose.</li>
            <li>Click <strong>Continue</strong> and fill in the candidate&apos;s info.</li>
          </ol>

          <h3 className="text-sm font-semibold text-navy mb-2">Manual Entry</h3>
          <p className="text-sm text-gray-700 mb-2">
            If you already have the candidate&apos;s information and don&apos;t need to send them an invite:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
            <li>On the confirmation step, choose <strong>Manual Entry</strong>.</li>
            <li>Fill in the candidate&apos;s first name, last name, email, and phone.</li>
            <li>Click <strong>Submit</strong>.</li>
          </ol>
          <p className="text-sm text-gray-500 mt-2">
            This creates the candidate record without sending an invitation email.
          </p>
        </section>

        <hr className="border-gray-100" />

        {/* What the Candidate Sees */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">What the Candidate Sees</h2>
          <p className="text-sm text-gray-700 mb-2">
            When a candidate clicks the invite link in their email:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
            <li>Their name, email, and package are pre-filled from your invite.</li>
            <li>They see exactly which screening components will be run (but <strong>not</strong> the price — that&apos;s your cost).</li>
            <li>They fill in their personal information: full SSN, date of birth, driver&apos;s license, address, etc.</li>
            <li>They review the FCRA disclosure and sign the consent form electronically.</li>
            <li>Once submitted, the screening begins automatically.</li>
          </ol>
        </section>

        <hr className="border-gray-100" />

        {/* Candidates */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Managing Candidates</h2>

          <h3 className="text-sm font-semibold text-navy mb-2">Viewing Your Candidates</h3>
          <p className="text-sm text-gray-700 mb-2">
            Click <strong>Candidates</strong> in the sidebar to see all submissions.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700 mb-4">
            <li><strong>Admin users</strong> see every candidate in the company</li>
            <li><strong>Standard users</strong> see only candidates they personally submitted</li>
          </ul>
          <p className="text-sm text-gray-700 mb-5">
            Each row shows the candidate&apos;s name, package, status, and submission date.
          </p>

          <h3 className="text-sm font-semibold text-navy mb-2">Candidate Detail</h3>
          <p className="text-sm text-gray-700 mb-2">Click on a candidate to see their full record:</p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700 mb-5">
            <li>Status and tracking code</li>
            <li>Package details and screening components</li>
            <li>Screening progress</li>
            <li>Uploaded documents</li>
            <li>Consent record</li>
          </ul>

          <h3 className="text-sm font-semibold text-navy mb-2">Candidate Actions</h3>
          <p className="text-sm text-gray-700 mb-2">From the candidate detail page, you can:</p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
            <li><strong>Resend Invite</strong> — re-send the consent form email if the candidate didn&apos;t receive it</li>
            <li><strong>Cancel</strong> — cancel a pending screening (the candidate won&apos;t be charged)</li>
            <li><strong>Reactivate</strong> — restore a cancelled candidate back to active status</li>
            <li><strong>Delete</strong> — permanently remove a candidate record (only available if the screening hasn&apos;t been paid for or completed)</li>
            <li><strong>Edit</strong> — update candidate info for cancelled or pending candidates</li>
          </ul>
        </section>

        <hr className="border-gray-100" />

        {/* Tracking */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Tracking a Candidate&apos;s Status</h2>
          <p className="text-sm text-gray-700 mb-2">
            Candidates can check their own screening status without logging in:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
            <li>Visit the <strong>Track Status</strong> page (linked from the main website).</li>
            <li>Enter the tracking code (format: PCG-XXXXXXXX).</li>
            <li>The page shows their current status and progress timeline.</li>
          </ol>
          <p className="text-sm text-gray-500 mt-2">
            You can share the tracking code with candidates at any time from the candidate detail page.
          </p>
        </section>

        <hr className="border-gray-100" />

        {/* Billing */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Billing</h2>
          <p className="text-sm text-gray-700 mb-3">
            Your billing depends on how your account is configured:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700 mb-3">
            <li><strong>Per-candidate billing</strong> — each screening is billed individually</li>
            <li><strong>Monthly billing</strong> — screenings are aggregated into a monthly invoice</li>
          </ul>
          <p className="text-sm text-gray-700 mb-2">
            Candidate payment statuses you may see:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
            <li><strong>Employer Billed</strong> — the screening has been submitted and you&apos;ll be invoiced</li>
            <li><strong>Invoiced</strong> — PCG has sent an invoice for this screening</li>
            <li><strong>Paid</strong> — payment received</li>
          </ul>
        </section>

        <hr className="border-gray-100" />

        {/* Team Management */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Team Management</h2>
          <div className="bg-navy/5 rounded-lg px-4 py-2.5 mb-3">
            <p className="text-xs text-navy italic">Team management is only available to admin users.</p>
          </div>
          <p className="text-sm text-gray-700 mb-2">
            Click <strong>Team</strong> in the sidebar to manage your company&apos;s portal users.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
            <li><strong>View</strong> all users on your team with their name, email, and role</li>
            <li><strong>Add</strong> new team members — they&apos;ll receive a magic link email to log in</li>
            <li><strong>Edit</strong> user roles:
              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                <li><strong>Admin</strong> — can see all candidates, manage team, and access settings</li>
                <li><strong>User</strong> — can invite candidates and see only their own submissions</li>
              </ul>
            </li>
            <li><strong>Remove</strong> users who no longer need access</li>
          </ul>
          <p className="text-sm text-gray-500 mt-2">
            If you don&apos;t see the Team link, you have a standard user account. Ask your company admin to upgrade your role if needed.
          </p>
        </section>

        <hr className="border-gray-100" />

        {/* Resources */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Resources</h2>
          <p className="text-sm text-gray-700">
            Click <strong>Resources</strong> in the sidebar for helpful documents and guides provided by
            PCG Screening — forms, compliance information, and reference materials.
          </p>
        </section>

        <hr className="border-gray-100" />

        {/* Settings */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Settings</h2>
          <p className="text-sm text-gray-700">
            Click <strong>Settings</strong> to view and update your account preferences. Some settings
            may be managed by your company admin or by PCG Screening directly.
          </p>
        </section>

        <hr className="border-gray-100" />

        {/* Mobile */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Mobile Use</h2>
          <p className="text-sm text-gray-700 mb-2">
            The portal works on phones and tablets. On smaller screens:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
            <li>The sidebar is replaced by a <strong>bottom navigation bar</strong></li>
            <li>Tap <strong>More</strong> (the three-line icon) to access Team, Resources, Settings, and Log Out</li>
            <li>All features work the same as on desktop</li>
          </ul>
        </section>

        <hr className="border-gray-100" />

        {/* Getting Help */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Getting Help</h2>
          <p className="text-sm text-gray-700 mb-2">
            Click the <strong>Help</strong> button in the bottom-right corner of any page. You can:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
            <li><strong>Email support</strong> — sends an email to accounts@pcgscreening.com</li>
            <li><strong>Call support</strong> — dial (770) 716-1278 directly</li>
            <li><strong>Share your screen</strong> — lets a PCG admin see your screen in real-time to help troubleshoot</li>
            <li><strong>Read this guide</strong> — opens this page</li>
          </ul>
        </section>

        <hr className="border-gray-100" />

        {/* Logging Out */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Logging Out</h2>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
            <li><strong>Desktop:</strong> Click <strong>Log Out</strong> at the bottom of the sidebar</li>
            <li><strong>Mobile:</strong> Tap <strong>More</strong> in the bottom nav, then tap <strong>Log Out</strong></li>
          </ul>
        </section>

        <hr className="border-gray-100" />

        {/* FAQ */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Common Questions</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold">Q: I invited a candidate but they didn&apos;t get the email.</p>
              <p className="text-gray-600 mt-0.5">Check that you entered the correct email address. The candidate should also check their spam folder. You can resend the invite from the candidate detail page. If the issue persists, contact PCG Screening.</p>
            </div>
            <div>
              <p className="font-semibold">Q: Can I change a candidate&apos;s package after inviting them?</p>
              <p className="text-gray-600 mt-0.5">You can cancel the candidate and create a new invite with the correct package, or contact PCG Screening to update the screening components on their end.</p>
            </div>
            <div>
              <p className="font-semibold">Q: Can I delete a candidate?</p>
              <p className="text-gray-600 mt-0.5">Yes, as long as the screening hasn&apos;t been paid for or completed. Go to the candidate detail page and click Delete.</p>
            </div>
            <div>
              <p className="font-semibold">Q: A candidate was cancelled by mistake. Can I undo it?</p>
              <p className="text-gray-600 mt-0.5">Yes. Go to the candidate detail page and click Reactivate. This restores them to active status.</p>
            </div>
            <div>
              <p className="font-semibold">Q: I&apos;m a standard user but need to see all candidates.</p>
              <p className="text-gray-600 mt-0.5">Ask your company admin to change your role to Admin in the Team section.</p>
            </div>
            <div>
              <p className="font-semibold">Q: How long does a screening take?</p>
              <p className="text-gray-600 mt-0.5">Most screenings complete within 1–3 business days, depending on the package and jurisdictions involved.</p>
            </div>
            <div>
              <p className="font-semibold">Q: Does the candidate see the price of the screening?</p>
              <p className="text-gray-600 mt-0.5">No. Candidates only see which screening components will be run, not the cost. Pricing is only visible to you in your portal.</p>
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Contact */}
        <section>
          <h2 className="font-heading text-navy text-xl mb-3">Need Help?</h2>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
            <li>Email: <a href="mailto:accounts@pcgscreening.com" className="text-gold hover:underline">accounts@pcgscreening.com</a></li>
            <li>Phone: <a href="tel:+17707161278" className="text-gold hover:underline">(770) 716-1278</a></li>
            <li>Website: <a href="https://www.pcgscreening.net" className="text-gold hover:underline">www.pcgscreening.net</a></li>
          </ul>
        </section>
      </div>

    </div>
  )
}
