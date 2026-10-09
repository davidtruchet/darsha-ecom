import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'
import { createHmac, timingSafeEqual } from 'node:crypto'

export function mercadoPagoClient() {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN)
    throw new Error('Mercado Pago no está configurado todavía.')
  return new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    options: { timeout: 10000 },
  })
}
export const getPayment = (id: string) => new Payment(mercadoPagoClient()).get({ id })
export const preferenceClient = () => new Preference(mercadoPagoClient())
export function checkoutPublicURL() {
  const url = new URL(process.env.CHECKOUT_PUBLIC_URL || '')
  if (url.protocol !== 'https:' || url.username || url.password)
    throw new Error('Configura CHECKOUT_PUBLIC_URL con una URL HTTPS pública.')
  return url.origin
}
export function verifyWebhookSignature(
  signature: string | null,
  requestID: string | null,
  dataID: string | null,
  secret: string,
) {
  if (!signature || !requestID || !dataID || !secret) return false
  const parts = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=')))
  if (!/^\d+$/.test(parts.ts || '') || !/^[a-f0-9]{64}$/i.test(parts.v1 || '')) return false
  const manifest = `id:${dataID.toLowerCase()};request-id:${requestID};ts:${parts.ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest()
  return timingSafeEqual(expected, Buffer.from(parts.v1, 'hex'))
}

export async function getMerchantAccount() {
  const response = await fetch('https://api.mercadopago.com/users/me', {
    headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
    signal: AbortSignal.timeout(10000),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Cannot verify Mercado Pago merchant account')
  return response.json() as Promise<{ id: number; tags?: string[] }>
}

export function paymentEnvironmentMatches(
  payment: { collector_id?: number; live_mode?: boolean },
  merchant: { id: number; tags?: string[] },
  collector: string,
  mode: string | undefined,
) {
  if (String(merchant.id) !== collector || String(payment.collector_id) !== collector) return false
  const testAccount = merchant.tags?.includes('test_user') === true
  // Checkout Pro test users use APP_USR credentials and can return live_mode: true.
  if (mode === 'test') return testAccount
  return mode === 'production' && !testAccount && payment.live_mode === true
}
