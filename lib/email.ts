import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: 'info@ovuscare.com',
    pass: process.env.TITAN_EMAIL_PASSWORD,
  },
})

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendFlaggedMessageAlert({
  patientDisplayName,
  message,
  clinicEmail,
}: {
  patientDisplayName: string
  message: string
  clinicEmail: string
}): Promise<void> {
  await transporter.sendMail({
    from: '"OvusCare" <info@ovuscare.com>',
    to: clinicEmail,
    subject: `⚠️ Flagged message from patient`,
    html: `
      <h2 style="font-family:sans-serif;color:#1A2B2B">Flagged patient message</h2>
      <p style="font-family:sans-serif;font-size:14px;color:#334155">
        A patient message has been flagged as requiring attention.
      </p>
      <table style="font-family:sans-serif;font-size:14px;color:#334155;border-collapse:collapse;margin-top:16px">
        <tr>
          <td style="padding:6px 16px 6px 0;color:#64748B;white-space:nowrap">Patient</td>
          <td>${escapeHtml(patientDisplayName)}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 0;color:#64748B;white-space:nowrap">Message</td>
          <td>${escapeHtml(message)}</td>
        </tr>
      </table>
      <p style="font-family:sans-serif;font-size:13px;color:#94A3B8;margin-top:24px">
        Review this conversation in the <a href="https://app.ovuscare.com" style="color:#0D9488">OvusCare dashboard</a>.
      </p>
    `,
  })
}
