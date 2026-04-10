import { Resend } from 'resend';
import { getSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName, lastName, email, phone, dob, ssn4, address,
      packageName, packagePrice, confirmationCode,
      signatureType, signatureValue,
      stripeSessionId, signatureRequestId,
      clientName,
    } = body;

    // Store in Supabase
    const supabase = getSupabase();
    if (supabase) {
      const { error: dbError } = await supabase.from('submissions').insert({
        confirmation_code: confirmationCode,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        dob: dob || null,
        ssn_last4: ssn4 || null,
        address,
        package_name: packageName,
        package_price: packagePrice,
        signature_type: signatureType || null,
        signature_value: signatureValue || null,
        stripe_session_id: stripeSessionId || null,
        signature_request_id: signatureRequestId || null,
        payment_status: stripeSessionId ? 'paid' : 'unpaid',
        consent_status: signatureRequestId ? 'signed' : (signatureValue ? 'signed' : 'pending'),
        client_name: clientName || null,
      });
      if (dbError) console.error('Supabase insert error:', dbError);
    }

    // Send emails via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const portalUrl = process.env.PORTAL_URL || 'https://pcg-screening.vercel.app';
      const adminEmail = process.env.PCG_ADMIN_EMAIL;
      const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

      // Send confirmation email to candidate
      await resend.emails.send({
        from: `PCG Screening Services <${fromEmail}>`,
        to: email,
        subject: `Screening Confirmed — ${confirmationCode}`,
        html: buildCandidateEmail({ firstName, packageName, packagePrice, confirmationCode, portalUrl }),
      });

      // Send notification to PCG admin
      if (adminEmail) {
        await resend.emails.send({
          from: `PCG Screening Portal <${fromEmail}>`,
          to: adminEmail,
          subject: `New Screening Submission — ${firstName} ${lastName} (${packageName})`,
          html: buildAdminEmail({ firstName, lastName, email, phone, dob, address, packageName, packagePrice, confirmationCode, stripeSessionId, signatureRequestId }),
        });
      }
    }

    // Link to employer portal candidate record if submitted via client link
    if (supabase && clientName) {
      const { data: candidate } = await supabase
        .from('candidates')
        .select('id')
        .eq('client_slug', clientName)
        .eq('email', email)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (candidate) {
        await supabase
          .from('candidates')
          .update({
            status: 'in_progress',
            screening_started_at: new Date().toISOString(),
            payment_status: stripeSessionId ? 'paid' : 'pending',
            consent_status: signatureValue || signatureRequestId ? 'signed' : 'pending',
          })
          .eq('id', candidate.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process submission' }, { status: 500 });
  }
}

function buildCandidateEmail({ firstName, packageName, packagePrice, confirmationCode, portalUrl }: {
  firstName: string; packageName: string; packagePrice: number; confirmationCode: string; portalUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(31,47,74,0.08);">

        <!-- Header -->
        <tr><td style="background:#1f2f4a;padding:28px 32px;text-align:center;">
          <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:400;font-family:Georgia,serif;">PCG Screening Services</h1>
          <p style="margin:6px 0 0;font-size:11px;color:#e5c97a;letter-spacing:0.08em;text-transform:uppercase;">Confirmation Receipt</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:22px;color:#1f2f4a;font-family:Georgia,serif;font-weight:400;">Thanks, ${firstName}!</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#8a8680;line-height:1.6;">Your background screening authorization and payment have been received. Here's your confirmation details.</p>

          <!-- Confirmation Box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;border-radius:10px;border:1px solid #f0efec;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#8a8680;padding:8px 0;border-bottom:1px solid #e2e0db;">Confirmation</td>
                  <td style="font-size:14px;color:#1f2f4a;font-weight:700;text-align:right;padding:8px 0;border-bottom:1px solid #e2e0db;">${confirmationCode}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#8a8680;padding:8px 0;border-bottom:1px solid #e2e0db;">Package</td>
                  <td style="font-size:14px;color:#1f2f4a;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #e2e0db;">${packageName}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#8a8680;padding:8px 0;">Amount Paid</td>
                  <td style="font-size:14px;color:#1f2f4a;font-weight:600;text-align:right;padding:8px 0;">$${packagePrice}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- What's Next -->
          <h3 style="margin:0 0 12px;font-size:15px;color:#1f2f4a;font-weight:600;">What Happens Next</h3>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="padding:4px 0;font-size:14px;color:#4a4743;line-height:1.6;">1. Our team will begin processing your screening immediately.</td></tr>
            <tr><td style="padding:4px 0;font-size:14px;color:#4a4743;line-height:1.6;">2. Most screenings are completed within <strong>1\u20133 business days</strong>.</td></tr>
            <tr><td style="padding:4px 0;font-size:14px;color:#4a4743;line-height:1.6;">3. Results will be shared with the requesting employer per your authorization.</td></tr>
          </table>

          <!-- Referral CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1f2f4a,#2a3f5f);border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:24px;text-align:center;">
              <p style="margin:0 0 12px;font-size:14px;color:#e5c97a;font-weight:600;">Know someone who needs a background check?</p>
              <a href="${portalUrl}" style="display:inline-block;padding:12px 28px;background:#c9a44c;color:#1f2f4a;text-decoration:none;border-radius:8px;font-size:14px;font-weight:700;">Share This Portal</a>
            </td></tr>
          </table>

          <!-- FCRA Notice -->
          <p style="margin:0;font-size:11px;color:#c8c5be;line-height:1.6;">Under the Fair Credit Reporting Act (FCRA), you have the right to request a copy of your screening report and to dispute any inaccurate information. For questions or disputes, please visit www.pcgscreening.net or contact us directly.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8f7f4;padding:20px 32px;text-align:center;border-top:1px solid #f0efec;">
          <p style="margin:0;font-size:11px;color:#c8c5be;">&copy; 2026 PCG Screening Services, LLC &middot; Metro Atlanta &middot; Serving Nationwide</p>
          <p style="margin:4px 0 0;font-size:11px;color:#c8c5be;font-style:italic;">"The advantage of knowledge is that wisdom preserves the lives of its possessors."</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildAdminEmail({ firstName, lastName, email, phone, dob, address, packageName, packagePrice, confirmationCode, stripeSessionId, signatureRequestId }: {
  firstName: string; lastName: string; email: string; phone: string; dob: string; address: string; packageName: string; packagePrice: number; confirmationCode: string; stripeSessionId?: string; signatureRequestId?: string;
}) {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(31,47,74,0.08);">
        <tr><td style="background:#1f2f4a;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;font-size:18px;color:#ffffff;font-family:Georgia,serif;">New Screening Submission</h1>
          <p style="margin:6px 0 0;font-size:11px;color:#e5c97a;letter-spacing:0.08em;text-transform:uppercase;">${timestamp} ET</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:13px;color:#8a8680;padding:8px 0;border-bottom:1px solid #f0efec;">Name</td><td style="font-size:14px;color:#1f2f4a;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #f0efec;">${firstName} ${lastName}</td></tr>
            <tr><td style="font-size:13px;color:#8a8680;padding:8px 0;border-bottom:1px solid #f0efec;">Email</td><td style="font-size:14px;color:#1f2f4a;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #f0efec;">${email}</td></tr>
            <tr><td style="font-size:13px;color:#8a8680;padding:8px 0;border-bottom:1px solid #f0efec;">Phone</td><td style="font-size:14px;color:#1f2f4a;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #f0efec;">${phone}</td></tr>
            <tr><td style="font-size:13px;color:#8a8680;padding:8px 0;border-bottom:1px solid #f0efec;">DOB</td><td style="font-size:14px;color:#1f2f4a;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #f0efec;">${dob}</td></tr>
            <tr><td style="font-size:13px;color:#8a8680;padding:8px 0;border-bottom:1px solid #f0efec;">Address</td><td style="font-size:14px;color:#1f2f4a;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #f0efec;">${address}</td></tr>
            <tr><td style="font-size:13px;color:#8a8680;padding:8px 0;border-bottom:1px solid #f0efec;">Package</td><td style="font-size:14px;color:#1f2f4a;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #f0efec;">${packageName}</td></tr>
            <tr><td style="font-size:13px;color:#8a8680;padding:8px 0;border-bottom:1px solid #f0efec;">Amount</td><td style="font-size:14px;color:#1f2f4a;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #f0efec;">$${packagePrice}</td></tr>
            <tr><td style="font-size:13px;color:#8a8680;padding:8px 0;border-bottom:1px solid #f0efec;">Confirmation</td><td style="font-size:14px;color:#1f2f4a;font-weight:700;text-align:right;padding:8px 0;border-bottom:1px solid #f0efec;">${confirmationCode}</td></tr>
            <tr><td style="font-size:13px;color:#8a8680;padding:8px 0;border-bottom:1px solid #f0efec;">Payment</td><td style="font-size:14px;color:${stripeSessionId ? '#2e7d32' : '#c62828'};font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid #f0efec;">${stripeSessionId ? 'Paid via Stripe' : 'Pending'}</td></tr>
            <tr><td style="font-size:13px;color:#8a8680;padding:8px 0;">Consent</td><td style="font-size:14px;color:${signatureRequestId ? '#2e7d32' : '#c62828'};font-weight:600;text-align:right;padding:8px 0;">${signatureRequestId ? 'Signed via Dropbox Sign' : 'Pending'}</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
