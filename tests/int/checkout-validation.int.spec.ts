import { describe, expect, it } from 'vitest'
import { createHmac } from 'node:crypto'
import { verifyWebhookSignature, paymentEnvironmentMatches } from '@/lib/checkout/mercadopago'
import { validateProviderPayment } from '@/lib/checkout/settlement'
import { validateCheckoutInput } from '@/lib/checkout/validation'

const contact = { name: 'Cliente de prueba', email: 'cliente@example.com', phone: '099123456' }
const pickup = {
  method: 'pickup' as const,
  department: '',
  locality: '',
  street: '',
  number: '',
  apartment: '',
  notes: '',
}
describe('checkout validation and payment authenticity', () => {
  it('permits cash and bank transfer only for pickup', () => {
    expect(() => validateCheckoutInput(contact, pickup, 'cash')).not.toThrow()
    expect(() => validateCheckoutInput(contact, pickup, 'bank-transfer')).not.toThrow()
    expect(() => validateCheckoutInput(contact, { ...pickup, method: 'delivery' }, 'cash')).toThrow(
      'Mercado Pago',
    )
  })
  it('requires valid customer details and a complete delivery address', () => {
    expect(() =>
      validateCheckoutInput({ ...contact, email: 'bad' }, pickup, 'mercadopago'),
    ).toThrow()
    expect(() =>
      validateCheckoutInput(
        contact,
        { ...pickup, method: 'delivery', department: 'Rocha', locality: 'Rocha' },
        'mercadopago',
      ),
    ).toThrow('dirección')
  })
  it('accepts Checkout Pro test-user payments with live_mode true but rejects real merchants in test mode', () => {
    const payment = { collector_id: 123, live_mode: true }
    const testSeller = { id: 123, tags: ['test_user'] }
    const realSeller = { id: 123, tags: [] }
    expect(paymentEnvironmentMatches(payment, testSeller, '123', 'test')).toBe(true)
    expect(
      paymentEnvironmentMatches({ ...payment, live_mode: false }, testSeller, '123', 'test'),
    ).toBe(true)
    expect(paymentEnvironmentMatches(payment, realSeller, '123', 'test')).toBe(false)
    expect(paymentEnvironmentMatches(payment, testSeller, '123', 'production')).toBe(false)
    expect(paymentEnvironmentMatches(payment, realSeller, '123', 'production')).toBe(true)
    expect(
      paymentEnvironmentMatches({ ...payment, live_mode: false }, realSeller, '123', 'production'),
    ).toBe(false)
    expect(paymentEnvironmentMatches(payment, testSeller, '124', 'test')).toBe(false)
  })
  it('verifies the complete webhook manifest and rejects modified fields or absent signatures', () => {
    const secret = 'test-secret'
    const digest = createHmac('sha256', secret)
      .update('id:123;request-id:request;ts:1704908010;')
      .digest('hex')
    expect(verifyWebhookSignature(`ts=1704908010,v1=${digest}`, 'request', '123', secret)).toBe(
      true,
    )
    expect(verifyWebhookSignature(`ts=1704908010,v1=${digest}`, 'request', '124', secret)).toBe(
      false,
    )
    expect(verifyWebhookSignature(null, 'request', '123', secret)).toBe(false)
    expect(verifyWebhookSignature('ts=1,v1=bad', 'request', '123', secret)).toBe(false)
  })
  it('requires approved status, exact reference, amount, UYU currency, merchant and environment', () => {
    const payment = {
      status: 'approved',
      external_reference: 'ref',
      transaction_amount: 965,
      currency_id: 'UYU',
      collector_id: 123,
      live_mode: false,
    }
    const attempt = { reference: 'ref', amount: 96500 }
    expect(validateProviderPayment(payment, attempt, '123', false)).toBe(true)
    for (const change of [
      { status: 'pending' },
      { external_reference: 'other' },
      { transaction_amount: 964 },
      { currency_id: 'USD' },
      { collector_id: 124 },
      { live_mode: true },
    ])
      expect(validateProviderPayment({ ...payment, ...change }, attempt, '123', false)).toBe(false)
  })
})
