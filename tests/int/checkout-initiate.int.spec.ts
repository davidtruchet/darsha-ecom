import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PayloadRequest } from 'payload'
import { checkoutInitiate } from '@/endpoints/checkout'

const gateway = vi.hoisted(() => ({ create: vi.fn(), release: vi.fn() }))
vi.mock('@/lib/checkout/mercadopago', () => ({
  checkoutPublicURL: () => 'https://darsha.example',
  preferenceClient: () => ({ create: gateway.create }),
  verifyWebhookSignature: vi.fn(),
}))
vi.mock('@/lib/checkout/settlement', () => ({
  expireAttempts: vi.fn(),
  releaseAttempt: (...args: unknown[]) => gateway.release(...args),
  createAttemptOrder: vi.fn(),
  reconcilePayment: vi.fn(),
}))
vi.mock('@/lib/checkout/database', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/checkout/database')>('@/lib/checkout/database')
  return {
    ...actual,
    inCheckoutTransaction: async (
      req: PayloadRequest,
      work: (r: PayloadRequest, db: unknown) => Promise<unknown>,
    ) => work(req, { execute: vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }) }),
  }
})
const body = {
  cartID: 1,
  requestID: '12345678-1234-1234-1234-123456789012',
  secret: 'test-only',
  method: 'mercadopago',
  contact: { name: 'Tester', email: 'tester@example.com', phone: '099123456' },
  delivery: {
    method: 'delivery',
    department: 'Rocha',
    locality: 'Rocha',
    street: 'Calle de prueba',
    number: '1',
    apartment: '',
    notes: '',
  },
  amount: 1,
  shipping: 0,
}
function makeRequest() {
  let attempt: Record<string, unknown> = {}
  return {
    context: {},
    json: async () => body,
    payload: {
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn().mockImplementation(async ({ collection }) =>
        collection === 'carts'
          ? { id: 1, currency: 'UYU', status: 'active', items: [{ product: 3, quantity: 2 }] }
          : {
              id: 3,
              title: 'Crema',
              _status: 'published',
              shippingWeightGrams: 500,
              priceInUYUEnabled: true,
              priceInUYU: 96500,
            },
      ),
      findGlobal: vi.fn().mockResolvedValue({
        packagingWeightGrams: 100,
        rates: [{ maxWeightGrams: 2000, montevideoPrice: 28500, interiorPrice: 31100 }],
      }),
      create: vi.fn().mockImplementation(async ({ collection, data }) => {
        if (collection === 'checkout-attempts') {
          attempt = { ...data, id: 2 }
          return attempt
        }
        return { id: 4 }
      }),
      update: vi.fn().mockImplementation(async ({ data }) => ({ ...attempt, ...data })),
    },
  } as unknown as PayloadRequest
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN', 'test')
  vi.stubEnv('MERCADO_PAGO_WEBHOOK_SECRET', 'test')
  vi.stubEnv('MERCADO_PAGO_COLLECTOR_ID', '123')
  gateway.create.mockResolvedValue({
    id: 'pref',
    collector_id: 123,
    init_point: 'https://www.mercadopago.com.uy/checkout/test',
  })
})
afterEach(vi.unstubAllEnvs)
describe('Mercado Pago checkout initiation', () => {
  it('ignores browser amounts, freezes server prices, includes shipping and creates an access cookie', async () => {
    const req = makeRequest()
    const response = await checkoutInitiate.handler(req)
    expect(response.status).toBe(200)
    const preference = gateway.create.mock.calls[0][0].body
    expect(preference.items[0]).toMatchObject({ quantity: 2, unit_price: 965, currency_id: 'UYU' })
    expect(preference.items[1]).toMatchObject({
      id: 'darsha-shipping',
      quantity: 1,
      unit_price: 311,
      currency_id: 'UYU',
    })
    expect(
      preference.items.reduce(
        (sum: number, item: { quantity: number; unit_price: number }) =>
          sum + item.quantity * item.unit_price,
        0,
      ),
    ).toBe(2241)
    expect(preference.shipments).toBeUndefined()
    expect(preference.external_reference).toBeTruthy()
    expect(preference.notification_url).toBe('https://darsha.example/api/checkout/webhook')
    expect(preference.binary_mode).toBe(true)
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'transactions',
        data: expect.objectContaining({ amount: 224100 }),
      }),
    )
  })
  it('rejects a changed displayed total before reserving stock', async () => {
    const req = makeRequest()
    req.json = async () => ({ ...body, expectedAmount: 1 })
    const response = await checkoutInitiate.handler(req)
    expect(response.status).toBe(400)
    expect(req.payload.create).not.toHaveBeenCalled()
    expect(gateway.create).not.toHaveBeenCalled()
  })
  it('releases its reservation if preference creation fails', async () => {
    gateway.create.mockRejectedValue(new Error('Provider unavailable'))
    const response = await checkoutInitiate.handler(makeRequest())
    expect(response.status).toBe(400)
    expect(gateway.release).toHaveBeenCalledWith(expect.anything(), 2, 'cancelled')
  })
  it('does not reserve stock or create records when payment configuration is missing', async () => {
    vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN', '')
    const req = makeRequest()
    expect((await checkoutInitiate.handler(req)).status).toBe(503)
    expect(req.payload.create).not.toHaveBeenCalled()
    expect(gateway.create).not.toHaveBeenCalled()
  })
})
