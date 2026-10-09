import type { PayloadRequest } from 'payload'
import type { CheckoutAttempt } from '@/payload-types'
import type { CheckoutSnapshot } from './types'
import { inCheckoutTransaction, sql } from './database'
import { getPayment, getMerchantAccount, paymentEnvironmentMatches } from './mercadopago'

const idOf = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' ? value?.id : value

export async function createAttemptOrder(
  req: PayloadRequest,
  attempt: CheckoutAttempt,
  paid: boolean,
) {
  const snapshot = attempt.snapshot as unknown as CheckoutSnapshot
  const order = await req.payload.create({
    collection: 'orders',
    req,
    data: {
      amount: attempt.amount,
      currency: 'UYU',
      customer: idOf(attempt.customer),
      customerEmail: snapshot.contact.email,
      items: snapshot.lines.map((line) => ({
        product: line.product,
        variant: line.variant,
        quantity: line.quantity,
      })),
      status: 'processing',
      transactions: attempt.transaction ? [idOf(attempt.transaction)!] : [],
      checkoutReference: attempt.reference,
      paymentState: paid ? 'paid' : 'pending',
      paymentProvider: attempt.method,
      shippingAmount: snapshot.shipping,
      deliveryDetails: snapshot.delivery,
      purchaseSnapshot: snapshot as unknown as Record<string, unknown>,
    },
  })
  return order
}

export async function removePurchasedCartItems(
  request: PayloadRequest,
  db: Parameters<Parameters<typeof inCheckoutTransaction>[1]>[1],
  attempt: CheckoutAttempt,
) {
  const snapshot = attempt.snapshot as unknown as CheckoutSnapshot
  const cartID = idOf(attempt.cart)!
  await db.execute(sql`SELECT id FROM carts WHERE id = ${cartID} FOR UPDATE`)
  const cart = await request.payload.findByID({
    collection: 'carts',
    id: cartID,
    depth: 0,
    req: request,
  })
  // Subtract only purchased units; additions made during hosted checkout survive.
  const remaining = (cart.items || [])
    .map((item) => {
      const line = snapshot.lines.find(
        (line) =>
          line.cartItemID === item.id &&
          line.product === idOf(item.product) &&
          (line.variant ?? null) === (idOf(item.variant) ?? null),
      )
      return { ...item, quantity: Math.max(0, item.quantity - (line?.quantity || 0)) }
    })
    .filter((item) => item.quantity > 0)
  await request.payload.update({
    collection: 'carts',
    id: cartID,
    req: request,
    data: {
      items: remaining,
      currency: cart.currency || 'UYU',
      // Keep the reusable provider cart active; the order records the purchase.
    },
  })
}

export async function completeAttempt(req: PayloadRequest, attemptID: number, paymentID?: string) {
  return inCheckoutTransaction(req, async (request, db) => {
    await db.execute(sql`SELECT id FROM checkout_attempts WHERE id = ${attemptID} FOR UPDATE`)
    let attempt = await request.payload.findByID({
      collection: 'checkout-attempts',
      id: attemptID,
      req: request,
      depth: 0,
    })
    if (attempt.state === 'paid') {
      if (paymentID && attempt.paymentID && paymentID !== attempt.paymentID) {
        if (attempt.order)
          await request.payload.update({
            collection: 'orders',
            id: idOf(attempt.order)!,
            req: request,
            data: { paymentState: 'review' },
          })
        return request.payload.update({
          collection: 'checkout-attempts',
          id: attempt.id,
          req: request,
          data: { state: 'review' },
        })
      }
      return attempt
    }
    if (attempt.reservation !== 'held') {
      if (!paymentID)
        throw new Error('La reserva venció. Verifica el pedido antes de confirmar el pago.')
      return request.payload.update({
        collection: 'checkout-attempts',
        id: attempt.id,
        req: request,
        data: { state: 'review', paymentID },
      })
    }
    if (attempt.order)
      await request.payload.update({
        collection: 'orders',
        id: idOf(attempt.order)!,
        req: request,
        data: { paymentState: 'paid' },
      })
    else {
      const order = await createAttemptOrder(request, attempt, true)
      attempt = await request.payload.update({
        collection: 'checkout-attempts',
        id: attempt.id,
        req: request,
        data: { order: order.id },
      })
    }
    if (attempt.transaction)
      await request.payload.update({
        collection: 'transactions',
        id: idOf(attempt.transaction)!,
        req: request,
        data: { status: 'succeeded', order: idOf(attempt.order) },
      })
    if (attempt.method === 'mercadopago') {
      await removePurchasedCartItems(request, db, attempt)
    }
    return request.payload.update({
      collection: 'checkout-attempts',
      id: attempt.id,
      req: request,
      data: { state: 'paid', reservation: 'consumed', ...(paymentID ? { paymentID } : {}) },
    })
  })
}

export async function releaseAttempt(
  req: PayloadRequest,
  attemptID: number,
  state: 'expired' | 'cancelled',
) {
  return inCheckoutTransaction(req, async (request, db) => {
    await db.execute(sql`SELECT id FROM checkout_attempts WHERE id = ${attemptID} FOR UPDATE`)
    const attempt = await request.payload.findByID({
      collection: 'checkout-attempts',
      id: attemptID,
      depth: 0,
      req: request,
    })
    if (attempt.reservation !== 'held' || attempt.state === 'paid' || attempt.state === 'review')
      return
    const snapshot = attempt.snapshot as unknown as CheckoutSnapshot
    for (const line of [...snapshot.lines].sort(
      (a, b) => (a.variant || a.product) - (b.variant || b.product),
    )) {
      if (line.variant)
        await db.execute(
          sql`UPDATE variants SET inventory = COALESCE(inventory, 0) + ${line.quantity} WHERE id = ${line.variant}`,
        )
      else
        await db.execute(
          sql`UPDATE products SET inventory = COALESCE(inventory, 0) + ${line.quantity} WHERE id = ${line.product}`,
        )
    }
    if (attempt.transaction)
      await request.payload.update({
        collection: 'transactions',
        id: idOf(attempt.transaction)!,
        req: request,
        data: { status: state },
      })
    if (attempt.order)
      await request.payload.update({
        collection: 'orders',
        id: idOf(attempt.order)!,
        req: request,
        data: { status: 'cancelled', paymentState: 'cancelled' },
      })
    await request.payload.update({
      collection: 'checkout-attempts',
      id: attempt.id,
      req: request,
      data: { state, reservation: 'released' },
    })
  })
}

export async function confirmManualPayment(req: PayloadRequest, id: number) {
  const attempt = await req.payload.findByID({ collection: 'checkout-attempts', id, depth: 0, req })
  if (attempt.method === 'mercadopago') throw new Error('Mercado Pago debe confirmar este pago.')
  return completeAttempt(req, id)
}

export function validateProviderPayment(
  payment: Pick<
    Awaited<ReturnType<typeof getPayment>>,
    | 'status'
    | 'external_reference'
    | 'currency_id'
    | 'transaction_amount'
    | 'collector_id'
    | 'live_mode'
  >,
  attempt: Pick<CheckoutAttempt, 'reference' | 'amount'>,
  collector: string,
  live: boolean | undefined,
) {
  return (
    payment.status === 'approved' &&
    payment.external_reference === attempt.reference &&
    payment.currency_id === 'UYU' &&
    typeof payment.transaction_amount === 'number' &&
    Math.round(payment.transaction_amount * 100) === attempt.amount &&
    String(payment.collector_id) === collector &&
    (live === undefined || payment.live_mode === live)
  )
}

export async function reconcilePayment(req: PayloadRequest, paymentID: string) {
  const payment = await getPayment(paymentID)
  if (!payment.external_reference) return
  const found = await req.payload.find({
    collection: 'checkout-attempts',
    limit: 1,
    depth: 0,
    where: { reference: { equals: payment.external_reference } },
  })
  const attempt = found.docs[0]
  if (!attempt || attempt.method !== 'mercadopago') return
  const collector = process.env.MERCADO_PAGO_COLLECTOR_ID || ''
  const merchant = await getMerchantAccount()
  if (
    !collector ||
    !paymentEnvironmentMatches(payment, merchant, collector, process.env.MERCADO_PAGO_MODE)
  )
    throw new Error('Payment environment or merchant mismatch')
  if (payment.status === 'approved') {
    if (
      !validateProviderPayment(
        payment,
        attempt,
        collector,
        process.env.MERCADO_PAGO_MODE === 'production' ? true : undefined,
      )
    ) {
      // Record an authentic approved payment that needs attention without claiming it fully paid.
      await inCheckoutTransaction(req, async (request, db) => {
        await db.execute(sql`SELECT id FROM checkout_attempts WHERE id = ${attempt.id} FOR UPDATE`)
        const current = await request.payload.findByID({
          collection: 'checkout-attempts',
          id: attempt.id,
          depth: 0,
          req: request,
        })
        const order = current.order
          ? { id: idOf(current.order)! }
          : await createAttemptOrder(request, current, false)
        if (current.reservation === 'held') await removePurchasedCartItems(request, db, current)
        await request.payload.update({
          collection: 'orders',
          id: order.id,
          req: request,
          data: { paymentState: 'review' },
        })
        await request.payload.update({
          collection: 'checkout-attempts',
          id: current.id,
          req: request,
          data: {
            state: 'review',
            paymentID: String(payment.id),
            order: order.id,
            ...(current.reservation === 'held' ? { reservation: 'consumed' as const } : {}),
          },
        })
      })
      return
    }
    await completeAttempt(req, attempt.id, String(payment.id))
  } else if (['rejected', 'cancelled'].includes(payment.status || '')) {
    // A rejected payment can be retried in the same hosted preference; retain the reservation until expiry.
    return
  } else if (['refunded', 'charged_back'].includes(payment.status || '')) {
    if (attempt.order)
      await req.payload.update({
        collection: 'orders',
        id: idOf(attempt.order)!,
        context: { checkoutInternal: true },
        data: { paymentState: 'review' },
      })
    await req.payload.update({
      collection: 'checkout-attempts',
      id: attempt.id,
      context: { checkoutInternal: true },
      data: { state: 'review' },
    })
  }
}

export async function expireAttempts(req: PayloadRequest) {
  const found = await req.payload.find({
    collection: 'checkout-attempts',
    depth: 0,
    limit: 100,
    where: {
      and: [
        { reservation: { equals: 'held' } },
        { expiresAt: { less_than: new Date().toISOString() } },
        { state: { in: ['initializing', 'pending'] } },
      ],
    },
  })
  for (const attempt of found.docs) {
    // Reconcile before release so a delayed webhook does not discard an approved payment.
    if (attempt.method === 'mercadopago' && attempt.preferenceID) {
      const { Payment } = await import('mercadopago')
      const { mercadoPagoClient } = await import('./mercadopago')
      const payments = await new Payment(mercadoPagoClient()).search({
        options: { external_reference: attempt.reference, sort: 'date_created', criteria: 'desc' },
      })
      for (const payment of payments.results || [])
        if (payment.id && payment.status === 'approved')
          await reconcilePayment(req, String(payment.id))
    }
    await releaseAttempt(req, attempt.id, 'expired')
  }
}
