/** Exercise order transitions and durable deduplication without sending synthetic emails. */
import 'dotenv/config'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
const payload = await getPayload({ config })
const settings = await payload.findGlobal({ slug: 'order-email-settings', depth: 0 })
if (!settings.enabled || !settings.sellerEmail || !settings.replyTo)
  await payload.updateGlobal({
    slug: 'order-email-settings',
    data: {
      enabled: true,
      sellerEmail: settings.sellerEmail || 'davidmt04@gmail.com',
      replyTo: settings.replyTo || 'pedidos@espaciodarsha.com',
    },
  })
const req = () => createLocalReq({ context: { deferOrderEmails: true } }, payload)
const product = (await payload.find({ collection: 'products', limit: 1 })).docs[0]
assert(product)
let id: number | undefined
try {
  const order = await payload.create({
    collection: 'orders',
    req: await req(),
    data: {
      amount: 10000,
      currency: 'UYU',
      customerEmail: 'notification-verification@example.com',
      checkoutReference: randomUUID(),
      paymentState: 'pending',
      paymentProvider: 'cash',
      status: 'processing',
      deliveryDetails: { method: 'pickup' },
      purchaseSnapshot: {
        contact: {
          name: 'Verificación de correos',
          email: 'notification-verification@example.com',
          phone: '+59899123456',
        },
        delivery: { method: 'pickup', notes: '' },
        lines: [
          { product: product.id, title: 'Producto de prueba', quantity: 1, unitPrice: 10000 },
        ],
        subtotal: 10000,
        shipping: 0,
      },
      items: [{ product: product.id, quantity: 1 }],
    },
  })
  id = order.id
  await payload.update({
    collection: 'orders',
    id,
    req: await req(),
    data: { paymentState: 'paid' },
  })
  await Promise.all([
    payload.update({
      collection: 'orders',
      id,
      req: await req(),
      data: { fulfillmentStatus: 'ready-for-pickup' },
    }),
    payload.update({
      collection: 'orders',
      id,
      req: await req(),
      data: { fulfillmentStatus: 'ready-for-pickup' },
    }),
  ])
  await payload.update({
    collection: 'orders',
    id,
    req: await req(),
    data: { fulfillmentStatus: 'ready-for-pickup' },
  })
  const emails = await payload.find({
    collection: 'order-emails',
    where: { order: { equals: id } },
    depth: 0,
    limit: 20,
  })
  assert.equal(emails.docs.length, 6)
  assert.equal(new Set(emails.docs.map((email) => email.key)).size, 6)
  assert(emails.docs.every((email) => email.state === 'pending'))
  await assert.rejects(
    payload.update({
      collection: 'orders',
      id,
      req: await req(),
      data: { fulfillmentStatus: 'shipped' },
    }),
    /entrega pagado/,
  )
  console.log(
    'Pending, payment confirmation and pickup-ready transitions produced six distinct customer/seller emails; concurrent/repeated saves added none; pickup shipping transition rejected.',
  )
} finally {
  if (id) {
    const emails = await payload.find({
      collection: 'order-emails',
      where: { order: { equals: id } },
      limit: 20,
      depth: 0,
    })
    for (const email of emails.docs)
      await payload.update({
        collection: 'order-emails',
        id: email.id,
        data: { state: 'skipped', lastError: 'Verificación sintética: no enviar.' },
      })
    await payload.update({
      collection: 'orders',
      id,
      req: await createLocalReq({ context: { disableOrderNotifications: true } }, payload),
      data: { status: 'cancelled' },
    })
  }
}
process.exit(0)
