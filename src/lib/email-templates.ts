function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pcgscreening.net'
  return raw.trim().replace(/\/+$/, '')
}

function emailWrapper(content: string) {
  const siteUrl = getSiteUrl()
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
        <img src="${siteUrl}/Copy_of_PCG_Logo_with_Soft_Typography.png" alt="PCG Screening Services">
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

export function buildAdminInviteEmail({
  adminName,
  portalUrl,
}: {
  adminName: string
  portalUrl: string
}) {
  return emailWrapper(`
    <h1>Welcome to the PCG Admin Dashboard</h1>
    <p>Hi ${adminName},</p>
    <p>You've been added as a PCG Screening Services admin. Click below to set your password and access the admin dashboard.</p>
    <p style="text-align: center;">
      <a href="${portalUrl}" class="btn">Set Password & Sign In</a>
    </p>
    <p style="font-size: 13px; color: #8a8680;">This link expires in 24 hours. If you didn't expect this invitation, you can safely ignore this email.</p>
  `)
}

export function buildPasswordResetEmail({
  name,
  resetUrl,
}: {
  name: string
  resetUrl: string
}) {
  return emailWrapper(`
    <h1>Reset Your PCG Password</h1>
    <p>Hi ${name},</p>
    <p>We received a request to reset the password for your PCG Screening Services account. Click below to choose a new one.</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </p>
    <p style="font-size: 13px; color: #8a8680;">This link expires in 24 hours. If you didn't request a password reset, you can safely ignore this email — your account is still secure.</p>
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

export function buildGuestOrderConsentEmail({
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
    <h1>Background Screening Authorization Required</h1>
    <p>Hi ${candidateName},</p>
    <p><strong>${companyName}</strong> has ordered a <strong>${packageName}</strong> background screening on your behalf through PCG Screening Services.</p>
    <p>Before we can begin, federal law (FCRA) requires your written authorization. Please click the link below to review the disclosure, provide your personal information, and sign the consent form.</p>
    <p style="text-align: center;">
      <a href="${applyUrl}" class="btn">Complete Consent Form</a>
    </p>
    <p style="font-size: 13px; color: #8a8680;">This is a secure, encrypted process. Your personal information (SSN, address, etc.) is protected under FCRA regulations and will only be used for the authorized screening.</p>
    <p style="font-size: 13px; color: #8a8680;">If you have questions, contact PCG Screening at accounts@pcgscreening.com or 770-716-1278.</p>
  `)
}

export function buildGuestOrderBuyerConfirmationEmail({
  buyerName,
  companyName,
  candidateName,
  packageName,
  trackingCode,
}: {
  buyerName: string
  companyName: string
  candidateName: string
  packageName: string
  trackingCode: string
}) {
  return emailWrapper(`
    <h1>Order Confirmed</h1>
    <p>Hi ${buyerName},</p>
    <p>Your <strong>${packageName}</strong> screening order for <strong>${candidateName}</strong> has been received and payment confirmed.</p>
    <div class="tracking">
      <p style="margin: 0; color: #8a8680; font-size: 12px;">Tracking Code</p>
      <p class="tracking-code" style="margin: 4px 0 0;">${trackingCode}</p>
    </div>
    <p><strong>What happens next:</strong></p>
    <p>We've sent ${candidateName} a secure link to complete the FCRA consent form and provide their personal information. Once they complete it, the screening will begin automatically.</p>
    <p>You'll receive an email when results are ready. Most screenings complete within 1–3 business days after consent is received.</p>
    <p style="font-size: 13px; color: #8a8680;">Questions? Contact us at accounts@pcgscreening.com or 770-716-1278.</p>
  `)
}

export function buildCandidateSubmissionConfirmationEmail({
  candidateName,
  companyName,
  trackingCode,
  trackUrl,
}: {
  candidateName: string
  companyName: string
  trackingCode: string
  trackUrl: string
}) {
  return emailWrapper(`
    <h1>Background Screening Confirmation</h1>
    <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p>Hello ${candidateName},</p>
    <p>Thank you for completing your background screening questionnaire. <strong>Your file number is ${trackingCode}.</strong> Use this number when referring to your background screening report. If you have any questions regarding next steps, please contact us using the information below.</p>
    <div class="tracking">
      <p style="margin: 0; color: #8a8680; font-size: 12px;">Your File Number</p>
      <p class="tracking-code" style="margin: 4px 0 0;">${trackingCode}</p>
    </div>
    <p>Thank you,</p>
    <p><strong>${companyName}</strong></p>
    <hr style="border: none; border-top: 1px solid #e5e4e0; margin: 20px 0;">
    <p style="font-size: 13px; color: #8a8680;">NOTE: If you have any questions regarding your background screening report, please contact the background screening agency below.</p>
    <p style="font-size: 13px; color: #4a4743;">
      <strong>PCG Screening Services</strong><br>
      Phone: (770) 716-1278<br>
      Email: accounts@pcgscreening.com<br>
      Website: www.pcgscreening.net
    </p>
    <p style="text-align: center;">
      <a href="${trackUrl}" class="btn">Track Your Screening</a>
    </p>
    <p style="font-size: 11px; color: #8a8680;">This email is intended only for the person or entity to which it is addressed and may contain information that is privileged, confidential, or otherwise protected from disclosure. If you have received this email in error, please notify us immediately by replying to the sender.</p>
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

export function buildReportDeliveryEmail({
  candidateName,
  packageName,
  trackingCode,
  attachmentCount,
}: {
  candidateName: string
  packageName: string
  trackingCode: string
  attachmentCount: number
}) {
  return emailWrapper(`
    <h1>Background Screening Report</h1>
    <p>Please find attached the background screening report for <strong>${candidateName}</strong>.</p>
    <div class="tracking">
      <p style="margin:0; color: #8a8680; font-size: 12px;">Tracking Code</p>
      <p class="tracking-code" style="margin:4px 0 0;">${trackingCode}</p>
    </div>
    <p><strong>Package:</strong> ${packageName}</p>
    ${attachmentCount > 0 ? `<p>This report includes <strong>${attachmentCount} supplementary document${attachmentCount > 1 ? 's' : ''}</strong> attached to this email.</p>` : ''}
    <p style="font-size: 13px; color: #8a8680; margin-top: 20px;">
      This report is confidential and intended solely for the authorized recipient.
      If you have questions, contact us at <a href="mailto:accounts@pcgscreening.com" style="color: #c9a44c;">accounts@pcgscreening.com</a> or 770-716-1278.
    </p>
  `)
}
