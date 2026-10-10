import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

export function createEmailAdapter() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return undefined
  const fromAddress = process.env.EMAIL_FROM_ADDRESS?.trim()
  if (!fromAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress))
    throw new Error('Configure EMAIL_FROM_ADDRESS with a verified Resend sender address.')

  return nodemailerAdapter({
    defaultFromAddress: fromAddress,
    defaultFromName: process.env.EMAIL_FROM_NAME?.trim() || 'Espacio Darsha',
    // Vercel builds must not open SMTP connections. Authentication happens when sending.
    skipVerify: true,
    transportOptions: {
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: apiKey },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    },
  })
}
