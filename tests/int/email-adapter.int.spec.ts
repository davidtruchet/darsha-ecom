import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmailAdapter } from '@/lib/email'
const adapter = vi.hoisted(() => vi.fn())
vi.mock('@payloadcms/email-nodemailer', () => ({ nodemailerAdapter: adapter }))
afterEach(() => {
  vi.unstubAllEnvs()
  adapter.mockClear()
})
describe('Resend SMTP configuration', () => {
  it('keeps email disabled until a key is configured', () => {
    vi.stubEnv('RESEND_API_KEY', '')
    expect(createEmailAdapter()).toBeUndefined()
    expect(adapter).not.toHaveBeenCalled()
  })
  it('requires an explicit valid sender when email is enabled', () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key')
    vi.stubEnv('EMAIL_FROM_ADDRESS', '')
    expect(createEmailAdapter).toThrow('EMAIL_FROM_ADDRESS')
    vi.stubEnv('EMAIL_FROM_ADDRESS', 'invalid')
    expect(createEmailAdapter).toThrow('EMAIL_FROM_ADDRESS')
  })
  it('uses TLS and avoids connecting during builds', () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key')
    vi.stubEnv('EMAIL_FROM_ADDRESS', 'pedidos@example.com')
    vi.stubEnv('EMAIL_FROM_NAME', 'Espacio Darsha')
    createEmailAdapter()
    expect(adapter).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultFromAddress: 'pedidos@example.com',
        defaultFromName: 'Espacio Darsha',
        skipVerify: true,
        transportOptions: expect.objectContaining({
          host: 'smtp.resend.com',
          port: 465,
          secure: true,
          auth: { user: 'resend', pass: 'test-api-key' },
        }),
      }),
    )
  })
})
