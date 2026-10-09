/** Exercise a disposable manual checkout against the configured development database. No provider payments. */
import 'dotenv/config'
import assert from 'node:assert/strict'
import { getPayload, createLocalReq } from 'payload'
import config from '@payload-config'
import { checkoutInitiate, checkoutStatus } from '../endpoints/checkout'
import { releaseAttempt, completeAttempt } from '../lib/checkout/settlement'

const payload = await getPayload({ config })
const product = (
  await payload.find({
    collection: 'products',
    where: { slug: { equals: 'germaine-de-capuccini-tratamiento-labial-con-acido-hialuronico' } },
    limit: 1,
  })
).docs[0]
assert(product && product.inventory && product.inventory > 0)
const startingInventory = product.inventory
const cart = await payload.create({
  collection: 'carts',
  data: { currency: 'UYU', items: [{ product: product.id, quantity: 1 }] },
})
const body = {
  cartID: cart.id,
  requestID: crypto.randomUUID(),
  secret: cart.secret,
  contact: {
    name: 'Checkout verification',
    email: 'checkout-verification@example.com',
    phone: '099123456',
  },
  delivery: {
    method: 'pickup',
    department: '',
    locality: '',
    street: '',
    number: '',
    apartment: '',
    notes: '',
  },
  method: 'cash',
}
let attemptID: number | undefined
try {
  const req = await createLocalReq({}, payload)
  req.json = async () => body
  const response = await checkoutInitiate.handler(req)
  const result = await response.json()
  assert.equal(response.status, 200, JSON.stringify(result))
  const attempt = (
    await payload.find({
      collection: 'checkout-attempts',
      where: { reference: { equals: result.reference } },
      limit: 1,
      depth: 0,
    })
  ).docs[0]
  attemptID = attempt.id
  assert.equal(attempt.state, 'pending')
  assert.equal(attempt.reservation, 'held')
  assert(attempt.order)
  assert.equal(
    (await payload.findByID({ collection: 'products', id: product.id })).inventory,
    startingInventory - 1,
  )
  assert.equal((await payload.findByID({ collection: 'carts', id: cart.id })).items?.length, 0)
  const again = await createLocalReq({}, payload)
  again.json = async () => body
  const retry = await checkoutInitiate.handler(again)
  const retried = await retry.json()
  assert.equal(retry.status, 200, JSON.stringify(retried))
  assert.equal(retried.reference, result.reference)
  assert.equal(
    (await payload.findByID({ collection: 'products', id: product.id })).inventory,
    startingInventory - 1,
  )
  const cookie = retry.headers.get('set-cookie')!.split(';')[0]
  const statusReq = await createLocalReq({}, payload)
  statusReq.headers = new Headers({ cookie })
  statusReq.json = async () => ({ reference: result.reference })
  const status = await checkoutStatus.handler(statusReq)
  assert.equal(status.status, 200)
  assert.equal((await status.json()).state, 'pending')
  statusReq.headers = new Headers()
  assert.equal((await checkoutStatus.handler(statusReq)).status, 403)
  const admin = (
    await payload.find({ collection: 'users', limit: 1, where: { roles: { contains: 'admin' } } })
  ).docs[0]
  assert(admin)
  const adminReq = await createLocalReq({ user: admin }, payload)
  await payload.update({
    collection: 'checkout-attempts',
    id: attempt.id,
    data: { manualPaymentReceived: true },
    overrideAccess: false,
    req: adminReq,
  })
  const paid = await payload.findByID({ collection: 'checkout-attempts', id: attempt.id, depth: 0 })
  assert.equal(paid.state, 'paid')
  assert.equal(paid.reservation, 'consumed')
  await Promise.all([
    completeAttempt(await createLocalReq({}, payload), attempt.id),
    completeAttempt(await createLocalReq({}, payload), attempt.id),
  ])
  assert.equal(
    (
      await payload.find({
        collection: 'orders',
        where: { checkoutReference: { equals: result.reference } },
      })
    ).totalDocs,
    1,
  )
  assert.equal(
    (await payload.findByID({ collection: 'products', id: product.id })).inventory,
    startingInventory - 1,
  )
  payload.logger.info(
    'Verified manual confirmation, concurrent settlement retries, one order and one stock reservation.',
  )
  payload.logger.info(
    'Verified manual order, stock reservation, idempotent retry, guest receipt access and unauthorized denial.',
  )
} finally {
  if (attemptID) {
    const attempt = await payload.findByID({
      collection: 'checkout-attempts',
      id: attemptID,
      depth: 0,
    })
    if (attempt.reservation === 'consumed') {
      // This script's payment is synthetic. Restore only its single unit, not other stock changes.
      await payload.db.updateOne({
        collection: 'products',
        id: product.id,
        data: { inventory: { $inc: 1 } },
      })
      await payload.update({
        collection: 'checkout-attempts',
        id: attemptID,
        context: { checkoutInternal: true },
        data: { state: 'cancelled', reservation: 'released' },
      })
      if (typeof attempt.order === 'number')
        await payload.update({
          collection: 'orders',
          id: attempt.order,
          data: { status: 'cancelled', paymentState: 'cancelled' },
        })
      if (typeof attempt.transaction === 'number')
        await payload.update({
          collection: 'transactions',
          id: attempt.transaction,
          data: { status: 'cancelled' },
        })
    } else await releaseAttempt(await createLocalReq({}, payload), attemptID, 'cancelled')
  }
  assert.equal(
    (await payload.findByID({ collection: 'products', id: product.id })).inventory,
    startingInventory,
  )
  payload.logger.info('Temporary checkout cancelled and test stock restored.')
  await payload.destroy()
}
process.exit(0)
