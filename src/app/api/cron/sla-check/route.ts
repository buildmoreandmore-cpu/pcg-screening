import { Resend } from 'resend';
import { getSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (Vercel sends this for cron jobs)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Find submissions that have breached the 48-hour SLA
    const { data: flagged, error } = await supabase
      .from('submissions')
      .select('id, confirmation_code, first_name, last_name, email, package_name, client_name, screening_started_at, status_notes')
      .eq('status', 'in_progress')
      .eq('sla_flagged', false)
      .lt('screening_started_at', cutoff);

    if (error) {
      console.error('SLA check query error:', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    if (!flagged || flagged.length === 0) {
      return NextResponse.json({ checked: true, flagged: 0 });
    }

    // Flag each submission and record in history
    for (const sub of flagged) {
      await supabase
        .from('submissions')
        .update({ sla_flagged: true, last_status_update: new Date().toISOString() })
        .eq('id', sub.id);

      await supabase.from('status_history').insert({
        submission_id: sub.id,
        previous_status: 'in_progress',
        new_status: 'in_progress',
        notes: 'SLA breach: screening exceeded 48-hour window',
        changed_by: 'system',
      });
    }

    // Send digest email to admin
    await sendSlaAlertEmail(flagged);

    return NextResponse.json({ checked: true, flagged: flagged.length });
  } catch (error) {
    console.error('SLA check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendSlaAlertEmail(flagged: Array<{
  confirmation_code: string; first_name: string; last_name: string;
  package_name: string; client_name?: string; screening_started_at: string; status_notes?: string;
}>) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.PCG_ADMIN_EMAIL;
  if (!apiKey || !adminEmail) return;

  const resend = new Resend(apiKey);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  const rows = flagged.map((sub) => {
    const started = new Date(sub.screening_started_at);
    const hoursElapsed = Math.round((Date.now() - started.getTime()) / (1000 * 60 * 60));
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0efec;font-size:13px;color:#1f2f4a;font-weight:600;">${sub.confirmation_code}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0efec;font-size:13px;color:#4a4743;">${sub.first_name} ${sub.last_name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0efec;font-size:13px;color:#4a4743;">${sub.client_name || '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0efec;font-size:13px;color:#4a4743;">${sub.package_name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0efec;font-size:13px;color:#c62828;font-weight:600;">${hoursElapsed}h</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0efec;font-size:12px;color:#8a8680;">${sub.status_notes || '—'}</td>
    </tr>`;
  }).join('');

  await resend.emails.send({
    from: `PCG Screening Portal <${fromEmail}>`,
    to: adminEmail,
    subject: `SLA Alert — ${flagged.length} Screening(s) Exceeded 48 Hours`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(31,47,74,0.08);">
        <tr><td style="background:#c62828;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;font-size:18px;color:#ffffff;font-family:Georgia,serif;">SLA Alert</h1>
          <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.8);">${flagged.length} screening(s) exceeded the 48-hour processing window</p>
        </td></tr>
        <tr><td style="padding:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0efec;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f8f7f4;">
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a8680;text-transform:uppercase;letter-spacing:0.04em;">Code</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a8680;text-transform:uppercase;letter-spacing:0.04em;">Candidate</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a8680;text-transform:uppercase;letter-spacing:0.04em;">Client</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a8680;text-transform:uppercase;letter-spacing:0.04em;">Package</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a8680;text-transform:uppercase;letter-spacing:0.04em;">Elapsed</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a8680;text-transform:uppercase;letter-spacing:0.04em;">Notes</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin:20px 0 0;font-size:13px;color:#8a8680;text-align:center;">Please follow up on these screenings to maintain service quality.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
