/** Create a test checkout preference without paying; release its disposable stock reservation. */
import 'dotenv/config'
import assert from 'node:assert/strict'
import { getPayload, createLocalReq } from 'payload'
import config from '@payload-config'
import { checkoutInitiate } from '../endpoints/checkout'
import { preferenceClient } from '../lib/checkout/mercadopago'
import { releaseAttempt } from '../lib/checkout/settlement'

assert.equal(process.env.MERCADO_PAGO_MODE, 'test', 'Only run with test credentials.')
const account = await fetch('https://api.mercadopago.com/users/me', {
  headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
})
assert(account.ok, 'Cannot verify Mercado Pago test account.')
const seller = await account.json()
assert(seller.tags?.includes('test_user'), 'Refusing a real seller account.')
assert.equal(String(seller.id), process.env.MERCADO_PAGO_COLLECTOR_ID)
const payload = await getPayload({ config })
const product = (
  await payload.find({
    collection: 'products',
    where: { slug: { equals: 'germaine-de-capuccini-tratamiento-labial-con-acido-hialuronico' } },
    limit: 1,
  })
).docs[0]
assert(product?.inventory && product.inventory > 0)
const cart = await payload.create({
  collection: 'carts',
  data: { currency: 'UYU', items: [{ product: product.id, quantity: 1 }] },
})
const reference = crypto.randomUUID()
try {
  const req = await createLocalReq({}, payload)
  req.json = async () => ({
    cartID: cart.id,
    secret: cart.secret,
    requestID: reference,
    method: 'mercadopago',
    contact: {
      name: 'Preference verification',
      email: 'preference-verification@example.com',
      phone: '+59899123456',
    },
    delivery: {
      method: 'delivery',
      department: 'Montevideo',
      locality: 'Montevideo',
      street: 'Calle de prueba',
      number: '123',
      apartment: '',
      notes: '',
    },
  })
  const response = await checkoutInitiate.handler(req)
  const result = await response.json()
  assert.equal(response.status, 200, JSON.stringify(result))
  const attempt = (
    await payload.find({
      collection: 'checkout-attempts',
      where: { reference: { equals: reference } },
      depth: 0,
      limit: 1,
    })
  ).docs[0]
  assert(attempt.preferenceID && attempt.checkoutURL)
  const preference = await preferenceClient().get({ preferenceId: attempt.preferenceID })
  const total = (preference.items || []).reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0,
  )
  assert.equal(Math.round(total * 100), attempt.amount)
  assert(preference.items?.some((item) => item.id === 'darsha-shipping'))
  console.log('Mercado Pago preference includes the exact product plus shipping total.')
  assert.equal(attempt.state, 'pending')
  assert.equal(attempt.reservation, 'held')
  assert.equal(attempt.order, null)
  console.log(
    'Real test preference created; server-priced UYU checkout URL verified. No payment made.',
  )
} finally {
  const attempt = (
    await payload.find({
      collection: 'checkout-attempts',
      where: { reference: { equals: reference } },
      depth: 0,
      limit: 1,
    })
  ).docs[0]
  if (attempt?.reservation === 'held')
    await releaseAttempt(await createLocalReq({}, payload), attempt.id, 'cancelled')
  await payload.update({ collection: 'carts', id: cart.id, data: { items: [] } })
  console.log(
    'Disposable cart cleared and any held reservation released; cancelled attempt retained for audit.',
  )
  process.exit(0)
}
