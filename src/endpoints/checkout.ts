import type { Endpoint, PayloadRequest } from 'payload'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { inCheckoutTransaction, sql } from '@/lib/checkout/database'
import { calculateShippingQuote } from '@/utilities/shippingQuote'
import { validateCheckoutInput } from '@/lib/checkout/validation'
import type {
  CheckoutSnapshot,
  CheckoutContact,
  CheckoutDelivery,
  CheckoutLine,
} from '@/lib/checkout/types'
import {
  createAttemptOrder,
  expireAttempts,
  releaseAttempt,
  reconcilePayment,
} from '@/lib/checkout/settlement'
import {
  checkoutPublicURL,
  preferenceClient,
  verifyWebhookSignature,
} from '@/lib/checkout/mercadopago'
import type { CheckoutAttempt } from '@/payload-types'

const idOf = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' ? value?.id : value
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const cookieName = 'darsha_checkout'
const reservationMinutes = 20
function cookieValue(req: PayloadRequest) {
  return (
    req.headers
      .get('cookie')
      ?.split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1) || ''
  )
}
function authorized(req: PayloadRequest, attempt: CheckoutAttempt) {
  if (req.user && idOf(attempt.customer) === req.user.id) return true
  const cookie = cookieValue(req)
  const [reference, token] = cookie.split(':')
  if (reference !== attempt.reference || !token || !/^[a-f0-9]{64}$/.test(attempt.accessHash || ''))
    return false
  return timingSafeEqual(Buffer.from(hash(token), 'hex'), Buffer.from(attempt.accessHash, 'hex'))
}
function checkoutResponse(attempt: CheckoutAttempt, token: string) {
  return Response.json(
    {
      reference: attempt.reference,
      redirectURL:
        attempt.method === 'mercadopago' && attempt.state === 'pending'
          ? attempt.checkoutURL
          : `/checkout/result?reference=${attempt.reference}`,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Set-Cookie': `${cookieName}=${attempt.reference}:${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
      },
    },
  )
}

export const checkoutInitiate: Endpoint = {
  path: '/checkout/initiate',
  method: 'post',
  handler: async (req) => {
    let createdID: number | undefined
    try {
      const body = (await req.json!()) as {
        cartID: number
        requestID: string
        expectedAmount?: number
        secret?: string
        contact: CheckoutContact
        delivery: CheckoutDelivery
        method: string
      }
      validateCheckoutInput(body.contact, body.delivery, body.method)
      if (
        !Number.isSafeInteger(body.cartID) ||
        typeof body.requestID !== 'string' ||
        !/^[a-f0-9-]{36}$/.test(body.requestID)
      )
        throw new Error('Carrito inválido.')
      if (body.method === 'mercadopago') {
        if (
          !process.env.MERCADO_PAGO_ACCESS_TOKEN ||
          !process.env.MERCADO_PAGO_WEBHOOK_SECRET ||
          !process.env.MERCADO_PAGO_COLLECTOR_ID
        )
          return Response.json(
            {
              message: 'El pago online no está disponible por el momento. Tu carrito se conserva.',
            },
            { status: 503 },
          )
        checkoutPublicURL()
      }
      req.context.cartSecret = typeof body.secret === 'string' ? body.secret : undefined
      await req.payload.findByID({
        collection: 'carts',
        id: body.cartID,
        overrideAccess: false,
        depth: 0,
        req,
      })
      await expireAttempts(req)
      const token = randomBytes(32).toString('hex')
      const result = await inCheckoutTransaction(req, async (request, db) => {
        await db.execute(sql`SELECT id FROM carts WHERE id = ${body.cartID} FOR UPDATE`)
        const cart = await req.payload.findByID({
          collection: 'carts',
          id: body.cartID,
          req: request,
          depth: 0,
        })
        const previous = await req.payload.find({
          collection: 'checkout-attempts',
          req: request,
          depth: 0,
          limit: 1,
          where: {
            and: [{ reference: { equals: body.requestID } }, { cart: { equals: cart.id } }],
          },
        })
        if (previous.docs[0]) {
          const attempt = previous.docs[0]
          const saved = attempt.snapshot as unknown as CheckoutSnapshot
          if (
            ['name', 'email', 'phone'].some(
              (key) =>
                saved.contact[key as keyof CheckoutContact] !==
                body.contact[key as keyof CheckoutContact],
            ) ||
            ['method', 'department', 'locality', 'street', 'number', 'apartment', 'notes'].some(
              (key) =>
                saved.delivery[key as keyof CheckoutDelivery] !==
                body.delivery[key as keyof CheckoutDelivery],
            ) ||
            attempt.method !== body.method
          )
            throw new Error('Ya existe un pedido con otros datos para esta solicitud.')
          if (!['pending', 'initializing', 'paid', 'review'].includes(attempt.state))
            throw new Error('Este pedido ya no admite reintentos.')
          if (
            attempt.method === 'mercadopago' &&
            attempt.state === 'initializing' &&
            !attempt.checkoutURL
          )
            throw new Error('Tu pago se está preparando. Intenta nuevamente en unos segundos.')
          return {
            attempt: await req.payload.update({
              collection: 'checkout-attempts',
              id: attempt.id,
              req: request,
              data: { accessHash: hash(token) },
            }),
            created: false,
          }
        }
        if (
          cart.purchasedAt ||
          cart.status !== 'active' ||
          !cart.items?.length ||
          cart.currency !== 'UYU'
        )
          throw new Error('El carrito no está disponible para esta compra.')
        const fingerprint = hash(
          JSON.stringify({
            items: cart.items,
            contact: body.contact,
            delivery: body.delivery,
            method: body.method,
          }),
        )
        const active = await req.payload.find({
          collection: 'checkout-attempts',
          req: request,
          depth: 0,
          limit: 1,
          where: {
            and: [
              { cart: { equals: cart.id } },
              { reservation: { equals: 'held' } },
              { method: { equals: 'mercadopago' } },
            ],
          },
        })
        if (active.docs[0]) {
          if (active.docs[0].fingerprint !== fingerprint)
            throw new Error(
              'Ya tienes un pedido pendiente con este carrito. Completa ese pedido o espera al vencimiento de su reserva.',
            )
          if (active.docs[0].method === 'mercadopago' && !active.docs[0].checkoutURL)
            throw new Error('Tu pago se está preparando. Intenta nuevamente en unos segundos.')
          const attempt = await req.payload.update({
            collection: 'checkout-attempts',
            id: active.docs[0].id,
            req: request,
            data: { accessHash: hash(token) },
          })
          return { attempt, created: false }
        }
        const lines: CheckoutLine[] = []
        const weighted = []
        for (const item of cart.items) {
          if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0)
            throw new Error('Cantidad de producto inválida.')
          const productID = idOf(item.product)
          if (!productID) throw new Error('Producto no disponible.')
          const product = await req.payload.findByID({
            collection: 'products',
            id: productID,
            req: request,
            depth: 0,
          })
          if (product._status !== 'published') throw new Error('Un producto ya no está disponible.')
          let variant
          const variantID = idOf(item.variant)
          if (product.enableVariants) {
            if (!variantID) throw new Error('Selecciona la presentación del producto.')
            variant = await req.payload.findByID({
              collection: 'variants',
              id: variantID,
              req: request,
              depth: 0,
            })
            if (idOf(variant.product) !== product.id || variant._status !== 'published')
              throw new Error('Presentación no disponible.')
          } else if (variantID) throw new Error('Presentación inválida.')
          const target = variant || product
          if (
            !target.priceInUYUEnabled ||
            !Number.isSafeInteger(target.priceInUYU) ||
            (target.priceInUYU || 0) <= 0
          )
            throw new Error('Un producto no tiene un precio válido para pagar.')
          lines.push({
            product: product.id,
            cartItemID: item.id || undefined,
            ...(variant ? { variant: variant.id } : {}),
            quantity: item.quantity,
            title: variant?.title ? `${product.title} — ${variant.title}` : product.title,
            unitPrice: target.priceInUYU!,
          })
          weighted.push({ product, quantity: item.quantity })
        }
        const settings = await req.payload.findGlobal({ slug: 'shipping', req: request, depth: 0 })
        const shipping = calculateShippingQuote(body.delivery, weighted, settings)
        if (!shipping.available) throw new Error(shipping.message)
        const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
        const amount = subtotal + shipping.amount
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Total inválido.')
        if (body.expectedAmount !== undefined && body.expectedAmount !== amount)
          throw new Error('Los precios o el envío cambiaron. Revisa el carrito antes de confirmar.')
        const snapshot: CheckoutSnapshot = {
          contact: body.contact,
          delivery: body.delivery,
          lines,
          subtotal,
          shipping: shipping.amount,
          shippingService: shipping.service,
          currency: 'UYU',
        }
        // Reserve stock atomically; a concurrent checkout cannot buy the same last units.
        for (const line of [...lines].sort(
          (a, b) => (a.variant || a.product) - (b.variant || b.product),
        )) {
          const changed = line.variant
            ? await db.execute(
                sql`UPDATE variants SET inventory = inventory - ${line.quantity} WHERE id = ${line.variant} AND inventory >= ${line.quantity} RETURNING id`,
              )
            : await db.execute(
                sql`UPDATE products SET inventory = inventory - ${line.quantity} WHERE id = ${line.product} AND inventory >= ${line.quantity} RETURNING id`,
              )
          if (!changed.rows.length) throw new Error(`No hay stock suficiente de ${line.title}.`)
        }
        const reference = body.requestID
        const transaction = await req.payload.create({
          collection: 'transactions',
          req: request,
          data: {
            status: 'pending',
            amount,
            currency: 'UYU',
            customer: req.user?.id,
            customerEmail: body.contact.email,
            cart: cart.id,
            items: lines.map((line) => ({
              product: line.product,
              variant: line.variant,
              quantity: line.quantity,
            })),
            paymentProvider: body.method,
            paymentReference: reference,
          },
        })
        let attempt = await req.payload.create({
          collection: 'checkout-attempts',
          req: request,
          data: {
            reference,
            cart: cart.id,
            customer: req.user?.id,
            transaction: transaction.id,
            method: body.method as CheckoutAttempt['method'],
            state: body.method === 'mercadopago' ? 'initializing' : 'pending',
            reservation: 'held',
            amount,
            snapshot: snapshot as unknown as Record<string, unknown>,
            fingerprint,
            accessHash: hash(token),
            expiresAt: new Date(
              Date.now() +
                (body.method === 'mercadopago'
                  ? reservationMinutes / 60
                  : settings.unpaidPickupHours || 48) *
                  3600000,
            ).toISOString(),
          },
        })
        if (body.method !== 'mercadopago') {
          const order = await createAttemptOrder(request, attempt, false)
          attempt = await req.payload.update({
            collection: 'checkout-attempts',
            id: attempt.id,
            req: request,
            data: { order: order.id },
          })
          await req.payload.update({
            collection: 'carts',
            id: cart.id,
            req: request,
            data: { items: [] },
          })
          await req.payload.update({
            collection: 'transactions',
            id: transaction.id,
            req: request,
            data: { order: order.id },
          })
        }
        return { attempt, created: true }
      })
      let attempt = result.attempt
      if (result.created && attempt.method === 'mercadopago') {
        createdID = attempt.id
        const snapshot = attempt.snapshot as unknown as CheckoutSnapshot
        const origin = checkoutPublicURL()
        const back = `${origin}/checkout/result?reference=${attempt.reference}`
        const preference = await preferenceClient().create({
          body: {
            items: [
              ...snapshot.lines.map((line) => ({
                id: `${line.product}:${line.variant || ''}`,
                title: line.title,
                quantity: line.quantity,
                unit_price: line.unitPrice / 100,
                currency_id: 'UYU',
              })),
              ...(snapshot.shipping > 0
                ? [
                    {
                      id: 'darsha-shipping',
                      title: 'Envío UES Xpres a domicilio',
                      quantity: 1,
                      unit_price: snapshot.shipping / 100,
                      currency_id: 'UYU',
                    },
                  ]
                : []),
            ],
            payer: { name: snapshot.contact.name, email: snapshot.contact.email },
            external_reference: attempt.reference,
            back_urls: { success: back, pending: back, failure: back },
            auto_return: 'approved',
            notification_url: `${origin}/api/checkout/webhook`,
            binary_mode: true,
            payment_methods: {
              excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }, { id: 'bank_transfer' }],
            },
            expires: true,
            expiration_date_to: attempt.expiresAt,
          },
          requestOptions: { idempotencyKey: attempt.reference },
        })
        if (String(preference.collector_id) !== process.env.MERCADO_PAGO_COLLECTOR_ID)
          throw new Error('Preference merchant mismatch')
        const checkoutURL = preference.init_point
        if (
          !preference.id ||
          !checkoutURL ||
          !['www.mercadopago.com.uy', 'www.mercadopago.com', 'www.mercadopago.com.ar'].includes(
            new URL(checkoutURL).hostname,
          ) ||
          new URL(checkoutURL).protocol !== 'https:'
        )
          throw new Error('Mercado Pago no devolvió un checkout válido.')
        attempt = await req.payload.update({
          collection: 'checkout-attempts',
          id: attempt.id,
          context: { checkoutInternal: true },
          data: { preferenceID: preference.id, checkoutURL, state: 'pending' },
        })
      }
      return checkoutResponse(attempt, token)
    } catch (error) {
      if (createdID) await releaseAttempt(req, createdID, 'cancelled')
      const status =
        error && typeof error === 'object' && 'status' in error ? Number(error.status) : 400
      return Response.json(
        {
          message:
            status === 403 || status === 404
              ? 'No pudimos acceder a este carrito.'
              : createdID
                ? 'No pudimos iniciar Mercado Pago. Intenta nuevamente.'
                : error instanceof Error &&
                    /^(Completa|Revisa|Selecciona|Las entregas|Carrito|El carrito|Ya tienes|Tu pago|Cantidad|Producto|Un producto|Los precios|Presentación|Total|No hay stock|Hay productos|El peso|Este pedido|El tarifario)/.test(
                      error.message,
                    )
                  ? error.message
                  : 'No pudimos iniciar la compra. Intenta nuevamente.',
        },
        { status: status === 403 || status === 404 ? 403 : 400 },
      )
    }
  },
}

export const checkoutStatus: Endpoint = {
  path: '/checkout/status',
  method: 'post',
  handler: async (req) => {
    try {
      const body = (await req.json!()) as { reference: string; paymentID?: string }
      if (!body || typeof body.reference !== 'string' || !/^[a-f0-9-]{36}$/.test(body.reference))
        return Response.json({ message: 'Pedido inválido.' }, { status: 400 })
      const found = await req.payload.find({
        collection: 'checkout-attempts',
        where: { reference: { equals: body.reference } },
        limit: 1,
        depth: 0,
      })
      let attempt = found.docs[0]
      if (!attempt || !authorized(req, attempt))
        return Response.json({ message: 'No pudimos acceder a este pedido.' }, { status: 403 })
      if (attempt.method === 'mercadopago' && body.paymentID && /^\d+$/.test(body.paymentID))
        await reconcilePayment(req, body.paymentID)
      if (attempt.reservation === 'held' && new Date(attempt.expiresAt).getTime() < Date.now())
        await expireAttempts(req)
      attempt = await req.payload.findByID({
        collection: 'checkout-attempts',
        id: attempt.id,
        depth: 0,
      })
      const settings = await req.payload.findGlobal({ slug: 'shipping', depth: 0 })
      return Response.json(
        {
          reference: attempt.reference,
          state: attempt.state,
          method: attempt.method,
          amount: attempt.amount,
          orderID: idOf(attempt.order),
          createdAt: attempt.createdAt,
          expiresAt: attempt.expiresAt,
          checkoutURL:
            attempt.method === 'mercadopago' && attempt.state === 'pending'
              ? attempt.checkoutURL
              : null,
          snapshot: attempt.snapshot,
          bankInstructions:
            attempt.method === 'bank-transfer' ? settings.bankTransferInstructions : null,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    } catch (error) {
      req.payload.logger.error({
        msg: 'Checkout status reconciliation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return Response.json(
        { message: 'No pudimos consultar el pedido. Intenta nuevamente.' },
        { status: 503 },
      )
    }
  },
}

export const checkoutWebhook: Endpoint = {
  path: '/checkout/webhook',
  method: 'post',
  handler: async (req) => {
    const url = new URL(req.url || 'http://localhost')
    const dataID = url.searchParams.get('data.id')
    if (
      !verifyWebhookSignature(
        req.headers.get('x-signature'),
        req.headers.get('x-request-id'),
        dataID,
        process.env.MERCADO_PAGO_WEBHOOK_SECRET || '',
      )
    ) {
      req.payload.logger.warn({
        msg: 'Mercado Pago webhook signature rejected',
        hasSignature: Boolean(req.headers.get('x-signature')),
        hasRequestID: Boolean(req.headers.get('x-request-id')),
        hasDataID: Boolean(dataID),
        notificationType: url.searchParams.get('type') || url.searchParams.get('topic'),
        // Log only header presence; never the signature, signing secret or body.
      })
      return new Response(null, { status: 401 })
    }
    try {
      const body = (await req.json!()) as { type?: string; data?: { id?: string | number } }
      if (body.type !== 'payment') return new Response(null, { status: 200 })
      if (String(body.data?.id) !== dataID || !/^\d+$/.test(dataID || ''))
        return new Response(null, { status: 400 })
      await reconcilePayment(req, dataID!)
      return new Response(null, { status: 200 })
    } catch {
      req.payload.logger.error({ msg: 'Mercado Pago webhook reconciliation failed' })
      return new Response(null, { status: 503 })
    }
  },
}

export const checkoutExpire: Endpoint = {
  path: '/checkout/expire',
  method: 'post',
  handler: async (req) => {
    const scheduler =
      !!process.env.CRON_SECRET &&
      req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
    if (!scheduler && !req.user?.roles?.includes('admin'))
      return new Response(null, { status: 403 })
    await expireAttempts(req)
    return Response.json({ success: true })
  },
}

export const checkoutExpireGet: Endpoint = { ...checkoutExpire, method: 'get' }
