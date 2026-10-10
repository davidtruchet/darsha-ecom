import { afterEach, describe, expect, it, vi } from 'vitest'
import { orderEmailEvents, renderOrderEmail, type EmailOrder } from '@/lib/orderEmails/templates'
import { processOrderEmails } from '@/lib/orderEmails'
import type { Payload } from 'payload'
const sqlState = vi.hoisted(() => ({ claimed: false }))
vi.mock('next/server', () => ({
  after: () => {
    throw new Error('No request context')
  },
}))
vi.mock('@/lib/checkout/database', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/checkout/database')>('@/lib/checkout/database')
  return {
    ...actual,
    inCheckoutTransaction: async (
      req: unknown,
      work: (req: unknown, db: unknown) => Promise<unknown>,
    ) =>
      work(req, {
        execute: async () => {
          if (sqlState.claimed) return { rows: [] }
          sqlState.claimed = true
          return { rows: [{ id: 1 }] }
        },
      }),
  }
})
vi.mock('payload', () => ({
  createLocalReq: async (_: unknown, payload: unknown) => ({ payload }),
}))
const snapshot = {
  contact: {
    name: '<script>Cliente</script>',
    email: 'cliente@example.com',
    phone: '+59899123456',
  },
  delivery: { method: 'pickup', notes: '' },
  subtotal: 96500,
  shipping: 0,
  lines: [{ product: 1, title: 'Crema & sérum', quantity: 1, unitPrice: 96500 }],
}
const order = {
  id: 1,
  amount: 96500,
  checkoutReference: 'ref',
  paymentState: 'paid',
  paymentProvider: 'mercadopago',
  fulfillmentStatus: 'unfulfilled',
  purchaseSnapshot: snapshot,
} as unknown as EmailOrder
afterEach(() => {
  vi.unstubAllEnvs()
  sqlState.claimed = false
})
describe('order email events and content', () => {
  it('does not create events for webhook repeats or legacy orders', () => {
    expect(orderEmailEvents(order, order)).toEqual([])
    expect(orderEmailEvents({ ...order, checkoutReference: null })).toEqual([])
    expect(orderEmailEvents(order)).toEqual(['order-paid'])
    expect(orderEmailEvents(order, {} as EmailOrder)).toEqual(['order-paid'])
  })
  it('distinguishes pending, manual payment confirmation, review and fulfillment transitions', () => {
    const pending = { ...order, paymentState: 'pending' as const }
    expect(orderEmailEvents(pending)).toEqual(['order-pending'])
    expect(orderEmailEvents(order, pending)).toEqual(['payment-confirmed'])
    expect(orderEmailEvents({ ...order, paymentState: 'review' }, order)).toEqual([
      'payment-review',
    ])
    expect(orderEmailEvents({ ...order, fulfillmentStatus: 'ready-for-pickup' }, order)).toEqual([
      'ready-for-pickup',
    ])
    expect(orderEmailEvents({ ...order, fulfillmentStatus: 'shipped' }, order)).toEqual(['shipped'])
  })
  it('escapes authored/customer content and includes frozen UYU totals', () => {
    const email = renderOrderEmail(order, 'order-paid', false, {})
    expect(email.html).not.toContain('<script>Cliente</script>')
    expect(email.html).toContain('&lt;script&gt;')
    expect(email.html).toContain('Crema &amp; sérum')
    expect(email.text).toContain('965')
    expect(email.text).toContain('pesos uruguayos')
  })
  it('keeps unpaid pickup instructions explicit in readiness notifications', () => {
    const pending = { ...order, paymentState: 'pending' as const, paymentProvider: 'bank-transfer' }
    const email = renderOrderEmail(
      pending,
      'ready-for-pickup',
      false,
      { address: 'Darsha', hours: '10–18' },
      'Banco de prueba',
    )
    expect(email.text).toContain('pendiente de pago')
    expect(email.text).toContain('Banco de prueba')
    expect(email.text).toContain('10–18')
  })
})
function mockPayload(
  sendEmail = vi.fn().mockResolvedValue({ messageId: 'message', rejected: [] }),
) {
  const email = {
    id: 1,
    key: 'order-1-order-paid-customer',
    order: 1,
    event: 'order-paid',
    recipient: 'cliente@example.com',
    replyTo: 'pedidos@espaciodarsha.com',
    subject: 'Pago confirmado',
    html: '<p>Pedido</p>',
    text: 'Pedido',
    state: 'pending',
    attempts: 1,
    firstAttemptAt: new Date().toISOString(),
  }
  const update = vi.fn().mockResolvedValue({})
  const payload = {
    findGlobal: vi.fn().mockResolvedValue({ enabled: true }),
    find: vi.fn().mockResolvedValue({ docs: [email] }),
    findByID: vi
      .fn()
      .mockImplementation(async ({ collection }) => (collection === 'orders' ? order : email)),
    update,
    sendEmail,
  } as unknown as Payload
  return { payload, update, sendEmail, email }
}
describe('durable order-email worker', () => {
  it('claims notifications once under concurrent processing and passes the stable provider key', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    const { payload, sendEmail, update } = mockPayload()
    await Promise.all([processOrderEmails(payload), processOrderEmails(payload)])
    expect(sendEmail).toHaveBeenCalledOnce()
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { 'Resend-Idempotency-Key': 'order-1-order-paid-customer' },
        replyTo: 'pedidos@espaciodarsha.com',
      }),
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ state: 'sent' }) }),
    )
  })
  it('retains failed sends for bounded retries instead of losing them', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    const { payload, update } = mockPayload(
      vi.fn().mockRejectedValue(new Error('SMTP unavailable')),
    )
    expect(await processOrderEmails(payload)).toEqual({ sent: 0, failed: 1 })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ state: 'failed', nextAttemptAt: expect.any(String) }),
      }),
    )
  })
  it('does not automatically resend an uncertain email beyond Resend idempotency retention', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    const { payload, email, sendEmail, update } = mockPayload()
    email.firstAttemptAt = new Date(Date.now() - 24 * 3600000).toISOString()
    await processOrderEmails(payload)
    expect(sendEmail).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ state: 'review' }) }),
    )
  })
})
