import { Resend } from 'resend';
import { getSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.ADMIN_API_KEY;
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmationCode, status: newStatus, notes } = await req.json();

    if (!confirmationCode || !newStatus) {
      return NextResponse.json({ error: 'confirmationCode and status are required' }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Fetch current submission
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('id, first_name, last_name, email, package_name, status, screening_started_at, confirmation_code, client_name')
      .eq('confirmation_code', confirmationCode.trim().toUpperCase())
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const previousStatus = submission.status || 'pending';

    if (previousStatus === newStatus) {
      return NextResponse.json({ success: true, message: 'Status unchanged', previousStatus, newStatus });
    }

    // Build update object
    const update: Record<string, unknown> = {
      status: newStatus,
      last_status_update: new Date().toISOString(),
      status_notes: notes || null,
    };

    if (newStatus === 'in_progress' && !submission.screening_started_at) {
      update.screening_started_at = new Date().toISOString();
    }
    if (newStatus === 'completed') {
      update.screening_completed_at = new Date().toISOString();
    }

    // Update submission
    const { error: updateError } = await supabase
      .from('submissions')
      .update(update)
      .eq('id', submission.id);

    if (updateError) {
      console.error('Status update error:', updateError);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    // Insert status history
    await supabase.from('status_history').insert({
      submission_id: submission.id,
      previous_status: previousStatus,
      new_status: newStatus,
      notes: notes || null,
      changed_by: 'admin',
    });

    // Send status email to candidate
    await sendStatusEmail(submission, previousStatus, newStatus);

    return NextResponse.json({ success: true, previousStatus, newStatus });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendStatusEmail(
  submission: { first_name: string; email: string; package_name: string; confirmation_code: string; client_name?: string },
  previousStatus: string,
  newStatus: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const portalUrl = process.env.PORTAL_URL || 'https://pcg-screening.vercel.app';

  if (newStatus === 'in_progress' && (previousStatus === 'pending' || previousStatus === 'submitted')) {
    await resend.emails.send({
      from: `PCG Screening Services <${fromEmail}>`,
      to: submission.email,
      subject: `Screening Update — Your Background Check is In Progress`,
      html: buildStatusEmail({
        firstName: submission.first_name,
        packageName: submission.package_name,
        code: submission.confirmation_code,
        portalUrl,
        type: 'in_progress',
      }),
    });
  } else if (newStatus === 'completed') {
    await resend.emails.send({
      from: `PCG Screening Services <${fromEmail}>`,
      to: submission.email,
      subject: `Screening Complete — ${submission.confirmation_code}`,
      html: buildStatusEmail({
        firstName: submission.first_name,
        packageName: submission.package_name,
        code: submission.confirmation_code,
        portalUrl,
        type: 'completed',
      }),
    });
  }
}

function buildStatusEmail({ firstName, packageName, code, portalUrl, type }: {
  firstName: string; packageName: string; code: string; portalUrl: string; type: 'in_progress' | 'completed';
}) {
  const isInProgress = type === 'in_progress';
  const headline = isInProgress ? 'Your Screening is In Progress' : 'Your Screening is Complete';
  const message = isInProgress
    ? `Your <strong>${packageName}</strong> background screening is now being processed. Most screenings are completed within <strong>1–3 business days</strong>.`
    : `Your <strong>${packageName}</strong> background screening has been completed. Results have been delivered to the requesting employer per your authorization.`;
  const trackingNote = isInProgress
    ? `<p style="margin:16px 0 0;font-size:14px;color:#4a4743;line-height:1.6;">Track your status anytime at <a href="${portalUrl}/track.html" style="color:#c9a44c;font-weight:600;">${portalUrl}/track.html</a> using your code: <strong>${code}</strong></p>`
    : `<p style="margin:16px 0 0;font-size:13px;color:#8a8680;line-height:1.6;">If you have questions about your results, contact us at <a href="mailto:accounts@pcgscreening.com" style="color:#c9a44c;">accounts@pcgscreening.com</a>.</p>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(31,47,74,0.08);">
        <tr><td style="background:#1f2f4a;padding:28px 32px;text-align:center;">
          <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:400;font-family:Georgia,serif;">PCG Screening Services</h1>
          <p style="margin:6px 0 0;font-size:11px;color:#e5c97a;letter-spacing:0.08em;text-transform:uppercase;">Status Update</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:22px;color:#1f2f4a;font-family:Georgia,serif;font-weight:400;">${headline}</h2>
          <p style="margin:0 0 20px;font-size:14px;color:#4a4743;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0;font-size:14px;color:#4a4743;line-height:1.6;">${message}</p>
          ${trackingNote}
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;border-radius:10px;border:1px solid #f0efec;margin-top:24px;">
            <tr><td style="padding:16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#8a8680;padding:6px 0;">Tracking Code</td>
                  <td style="font-size:14px;color:#1f2f4a;font-weight:700;text-align:right;padding:6px 0;">${code}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#8a8680;padding:6px 0;">Package</td>
                  <td style="font-size:14px;color:#1f2f4a;font-weight:600;text-align:right;padding:6px 0;">${packageName}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#8a8680;padding:6px 0;">Status</td>
                  <td style="font-size:14px;color:${isInProgress ? '#1565c0' : '#2e7d32'};font-weight:600;text-align:right;padding:6px 0;">${isInProgress ? 'In Progress' : 'Completed'}</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8f7f4;padding:20px 32px;text-align:center;border-top:1px solid #f0efec;">
          <p style="margin:0;font-size:11px;color:#c8c5be;">&copy; 2026 PCG Screening Services, LLC &middot; Metro Atlanta &middot; Serving Nationwide</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
