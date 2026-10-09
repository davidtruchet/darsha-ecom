import { describe, expect, it, vi } from 'vitest'
import type { PayloadRequest } from 'payload'
import { shippingQuoteEndpoint } from '@/endpoints/shippingQuote'

function request(body: unknown, findByID = vi.fn()) {
  return {
    json: async () => body,
    context: {},
    payload: {
      findByID,
      find: vi.fn().mockResolvedValue({ docs: [{ id: 3, shippingWeightGrams: 500 }] }),
      findGlobal: vi
        .fn()
        .mockResolvedValue({
          packagingWeightGrams: 100,
          rates: [{ maxWeightGrams: 2000, montevideoPrice: 28500, interiorPrice: 31100 }],
        }),
      logger: { error: vi.fn() },
    },
  } as unknown as PayloadRequest
}
describe('shipping quote endpoint', () => {
  it('uses cart access control and refuses an inaccessible cart', async () => {
    const lookup = vi.fn().mockRejectedValue({ status: 403 })
    const req = request({ cartID: 1, destination: { method: 'pickup' } }, lookup)
    const response = await shippingQuoteEndpoint.handler(req)
    expect(response.status).toBe(403)
    expect(lookup.mock.calls[0][0].overrideAccess).toBe(false)
    expect(req.payload.findGlobal).not.toHaveBeenCalled()
  })
  it('passes guest authorization to access control and uses server product weights', async () => {
    const lookup = vi
      .fn()
      .mockResolvedValue({ status: 'active', items: [{ product: 3, quantity: 2 }] })
    const req = request(
      {
        cartID: 1,
        secret: 'test-only-secret',
        destination: { method: 'delivery', department: 'Rocha', locality: 'Rocha' },
        amount: 0,
        weight: 0,
      },
      lookup,
    )
    const response = await shippingQuoteEndpoint.handler(req)
    expect(req.context.cartSecret).toBe('test-only-secret')
    expect(await response.json()).toMatchObject({ amount: 31100, weightGrams: 1100 })
  })
  it('refuses purchased carts and malformed input', async () => {
    const req = request(
      { cartID: 1, destination: { method: 'pickup' } },
      vi.fn().mockResolvedValue({ status: 'purchased' }),
    )
    expect((await shippingQuoteEndpoint.handler(req)).status).toBe(409)
    expect((await shippingQuoteEndpoint.handler(request(null))).status).toBe(400)
  })
})
