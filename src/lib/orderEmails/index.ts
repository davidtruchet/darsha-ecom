import { after } from 'next/server'
import { createLocalReq, type Payload, type PayloadRequest } from 'payload'
import { randomUUID } from 'node:crypto'
import { inCheckoutTransaction, sql } from '@/lib/checkout/database'
import { orderEmailEvents, renderOrderEmail, type EmailOrder } from './templates'

export async function queueOrderEmails(
  req: PayloadRequest,
  doc: EmailOrder,
  previous?: EmailOrder | null,
) {
  if (req.context.disableOrderNotifications) return
  const events = orderEmailEvents(doc, previous)
  if (!events.length) return
  const settings = await req.payload.findGlobal({ slug: 'order-email-settings', req, depth: 0 })
  if (!settings.enabled) return
  const shipping = await req.payload.findGlobal({ slug: 'shipping', req, depth: 0 })
  const snapshot = doc.purchaseSnapshot as { contact: { email: string } }
  await inCheckoutTransaction(req, async (request, db) => {
    for (const event of events)
      for (const seller of [false, true]) {
        const recipient = seller ? settings.sellerEmail : snapshot.contact.email
        const key = `order-${doc.id}-${event}-${seller ? 'seller' : 'customer'}`
        await db.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${key}))`)
        const existing = await request.payload.find({
          collection: 'order-emails',
          where: { key: { equals: key } },
          req: request,
          depth: 0,
          limit: 1,
        })
        if (existing.docs.length) continue
        const email = renderOrderEmail(
          doc,
          event,
          seller,
          { address: shipping.pickupAddress, hours: shipping.pickupHours },
          shipping.bankTransferInstructions,
        )
        await request.payload.create({
          collection: 'order-emails',
          req: request,
          data: {
            key,
            order: doc.id,
            event,
            recipient,
            replyTo: settings.replyTo,
            ...email,
            state: 'pending',
            attempts: 0,
            nextAttemptAt: new Date().toISOString(),
          },
        })
      }
  })
  // Next keeps work alive after the HTTP response and the enclosing DB commit.
  // Local API scripts have no request context; their durable queue can be processed explicitly.
  if (!req.context.orderEmailsScheduled && !req.context.deferOrderEmails) {
    try {
      after(async () => {
        try {
          await processOrderEmails(req.payload)
        } catch {
          req.payload.logger.error({
            msg: 'Order email processing failed; queue retained for retry.',
          })
        }
      })
      req.context.orderEmailsScheduled = true
    } catch {
      /* Outside a Next request: leave notifications queued. */
    }
  }
}

export async function processOrderEmails(payload: Payload) {
  if (!process.env.RESEND_API_KEY) return { sent: 0, failed: 0 }
  const settings = await payload.findGlobal({ slug: 'order-email-settings', depth: 0 })
  if (!settings.enabled) return { sent: 0, failed: 0 }
  const now = new Date()
  const candidates = await payload.find({
    collection: 'order-emails',
    depth: 0,
    limit: 10,
    sort: 'createdAt',
    where: {
      or: [
        {
          and: [
            { state: { in: ['pending', 'failed'] } },
            { nextAttemptAt: { less_than_equal: now.toISOString() } },
            { attempts: { less_than: 5 } },
          ],
        },
        {
          and: [{ state: { equals: 'sending' } }, { leaseUntil: { less_than: now.toISOString() } }],
        },
      ],
    },
  })
  const startedAt = Date.now()
  let sent = 0,
    failed = 0
  for (const candidate of candidates.docs) {
    if (Date.now() - startedAt > 35000) break
    const token = randomUUID()
    const claimed = await inCheckoutTransaction(
      await createLocalReq({}, payload),
      async (request, db) => {
        const result = await db.execute(
          sql`UPDATE order_emails SET state = 'sending', lease_token = ${token}, lease_until = ${new Date(Date.now() + 120000).toISOString()}, attempts = attempts + 1, first_attempt_at = COALESCE(first_attempt_at, now()) WHERE id = ${candidate.id} AND ((state IN ('pending', 'failed') AND next_attempt_at <= now() AND attempts < 5) OR (state = 'sending' AND lease_until < now())) RETURNING id`,
        )
        if (!result.rows.length) return null
        return request.payload.findByID({
          collection: 'order-emails',
          id: candidate.id,
          depth: 0,
          req: request,
        })
      },
    )
    if (!claimed) continue
    // Resend's SMTP idempotency window is 24 hours. Do not automatically retry uncertain sends beyond it.
    if (new Date(claimed.firstAttemptAt!).getTime() < Date.now() - 23 * 3600000) {
      await payload.update({
        collection: 'order-emails',
        id: claimed.id,
        data: {
          state: 'review',
          lastError:
            'Revisar entrega en Resend antes de reintentar: ventana de deduplicación vencida.',
        },
      })
      continue
    }
    const orderID = typeof claimed.order === 'number' ? claimed.order : claimed.order.id
    const order = await payload.findByID({ collection: 'orders', id: orderID, depth: 0 })
    if (
      (claimed.event === 'order-pending' && order.paymentState === 'review') ||
      (['ready-for-pickup', 'shipped'].includes(claimed.event) &&
        (order.status === 'cancelled' ||
          order.paymentState === 'review' ||
          order.fulfillmentStatus !== claimed.event))
    ) {
      await payload.update({
        collection: 'order-emails',
        id: claimed.id,
        data: { state: 'skipped' },
      })
      continue
    }
    try {
      const result = (await payload.sendEmail({
        to: claimed.recipient,
        replyTo: claimed.replyTo,
        subject: claimed.subject,
        html: claimed.html,
        text: claimed.text,
        headers: { 'Resend-Idempotency-Key': claimed.key },
      })) as { messageId?: string; rejected?: string[] }
      if (result.rejected?.length) throw new Error('SMTP rejected recipient')
      await payload.update({
        collection: 'order-emails',
        id: claimed.id,
        data: {
          state: 'sent',
          sentAt: new Date().toISOString(),
          messageID: result.messageId,
          lastError: null,
          leaseToken: null,
          leaseUntil: null,
        },
      })
      sent++
    } catch {
      await payload.update({
        collection: 'order-emails',
        id: claimed.id,
        data: {
          state: 'failed',
          lastError:
            'No se pudo confirmar el envío. Revisa Resend; se reintentará con la misma clave.',
          nextAttemptAt: new Date(
            Date.now() + Math.min(60, 2 ** claimed.attempts) * 60000,
          ).toISOString(),
          leaseToken: null,
          leaseUntil: null,
        },
      })
      failed++
    }
  }
  return { sent, failed }
}
