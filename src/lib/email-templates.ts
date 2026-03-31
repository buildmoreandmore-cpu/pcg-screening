function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #f8f7f4; font-family: 'Georgia', serif; }
    .container { max-width: 520px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; }
    .header { text-align: center; margin-bottom: 24px; }
    .header img { height: 48px; }
    .divider { height: 2px; background: linear-gradient(to right, #c9a44c, #e5c97a); margin: 20px 0; border: none; }
    h1 { color: #1f2f4a; font-size: 20px; margin: 0 0 12px; }
    p { color: #4a4743; font-size: 15px; line-height: 1.6; margin: 0 0 12px; }
    .btn { display: inline-block; background: #1f2f4a; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 16px 0; }
    .footer { text-align: center; color: #8a8680; font-size: 12px; margin-top: 24px; }
    .tracking { background: #f0efec; border-radius: 8px; padding: 12px 16px; text-align: center; margin: 16px 0; }
    .tracking-code { color: #1f2f4a; font-size: 18px; font-weight: bold; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <img src="https://pcgscreening.com/Copy_of_PCG_Logo_with_Soft_Typography.png" alt="PCG Screening Services">
      </div>
      <hr class="divider">
      ${content}
    </div>
    <div class="footer">
      <p>PCG Screening Services &copy; ${new Date().getFullYear()}</p>
      <p>770-716-1278 &bull; accounts@pcgscreening.com</p>
    </div>
  </div>
</body>
</html>`
}

export function buildWelcomeEmail({
  contactName,
  portalUrl,
}: {
  contactName: string
  portalUrl: string
}) {
  return emailWrapper(`
    <h1>Welcome to PCG Screening Services</h1>
    <p>Hi ${contactName},</p>
    <p>You've been invited to the PCG Screening Services portal. Click below to access your dashboard — no password needed.</p>
    <p style="text-align: center;">
      <a href="${portalUrl}" class="btn">Access Your Dashboard</a>
    </p>
    <p>From your dashboard, you can invite candidates for screening, track progress in real-time, and download compliance documents.</p>
    <p>Questions? Contact us at accounts@pcgscreening.com or 770-716-1278.</p>
  `)
}

export function buildTeamInviteEmail({
  memberName,
  companyName,
  portalUrl,
}: {
  memberName: string
  companyName: string
  portalUrl: string
}) {
  return emailWrapper(`
    <h1>You've Been Added to ${companyName}'s Portal</h1>
    <p>Hi ${memberName},</p>
    <p>${companyName} has added you to their screening portal. Click below to get started.</p>
    <p style="text-align: center;">
      <a href="${portalUrl}" class="btn">Access Portal</a>
    </p>
  `)
}

export function buildCandidateInviteEmail({
  candidateName,
  companyName,
  packageName,
  applyUrl,
}: {
  candidateName: string
  companyName: string
  packageName: string
  applyUrl: string
}) {
  return emailWrapper(`
    <h1>Background Screening Request</h1>
    <p>Hi ${candidateName},</p>
    <p><strong>${companyName}</strong> has requested a background screening as part of their hiring process. Please click below to complete your authorization and information.</p>
    <p><strong>Package:</strong> ${packageName}</p>
    <p style="text-align: center;">
      <a href="${applyUrl}" class="btn">Complete Your Screening</a>
    </p>
    <p style="font-size: 13px; color: #8a8680;">This is a secure process. Your personal information is protected under FCRA regulations and will only be used for employment screening purposes.</p>
  `)
}

export function buildScreeningCompleteEmail({
  candidateName,
  packageName,
  trackingCode,
  detailUrl,
}: {
  candidateName: string
  packageName: string
  trackingCode: string
  detailUrl: string
}) {
  return emailWrapper(`
    <h1>Screening Complete</h1>
    <p>The <strong>${packageName}</strong> screening for <strong>${candidateName}</strong> has been completed.</p>
    <div class="tracking">
      <p style="margin: 0; color: #8a8680; font-size: 12px;">Tracking Code</p>
      <p class="tracking-code" style="margin: 4px 0 0;">${trackingCode}</p>
    </div>
    <p style="text-align: center;">
      <a href="${detailUrl}" class="btn">View Results</a>
    </p>
  `)
}
