import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.PCG_ADMIN_EMAIL;
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    if (apiKey && adminEmail) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: `PCG Screening Portal <${fromEmail}>`,
        to: adminEmail,
        replyTo: email,
        subject: `Contact Form: ${subject || 'General Inquiry'} — ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;">
            <h2 style="color:#1f2f4a;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            <hr style="border:none;border-top:1px solid #e2e0db;margin:16px 0;">
            <p><strong>Message:</strong></p>
            <p style="white-space:pre-wrap;color:#4a4743;">${message}</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
