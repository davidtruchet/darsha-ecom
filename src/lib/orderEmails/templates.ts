import type { Order } from '@/payload-types'
import type { CheckoutSnapshot } from '@/lib/checkout/types'
import { formatUYU } from '@/lib/currencies'
export type EmailEvent =
  | 'order-paid'
  | 'order-pending'
  | 'payment-confirmed'
  | 'payment-review'
  | 'ready-for-pickup'
  | 'shipped'
export type EmailOrder = Order & {
  fulfillmentStatus?: string | null
  trackingNumber?: string | null
}
const escape = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  )
export function orderEmailEvents(doc: EmailOrder, previous?: EmailOrder | null): EmailEvent[] {
  if (!doc.checkoutReference || !doc.purchaseSnapshot) return []
  const events: EmailEvent[] = []
  if (!previous?.id)
    events.push(
      doc.paymentState === 'paid'
        ? 'order-paid'
        : doc.paymentState === 'review'
          ? 'payment-review'
          : 'order-pending',
    )
  else if (doc.paymentState !== previous.paymentState) {
    if (doc.paymentState === 'paid') events.push('payment-confirmed')
    if (doc.paymentState === 'review') events.push('payment-review')
  }
  if (doc.fulfillmentStatus !== previous?.fulfillmentStatus) {
    if (doc.fulfillmentStatus === 'ready-for-pickup') events.push('ready-for-pickup')
    if (doc.fulfillmentStatus === 'shipped') events.push('shipped')
  }
  return events
}
export function renderOrderEmail(
  order: EmailOrder,
  event: EmailEvent,
  seller: boolean,
  pickup: { address?: string | null; hours?: string | null },
  bankInstructions?: string | null,
) {
  const snapshot = order.purchaseSnapshot as unknown as CheckoutSnapshot
  const titles: Record<EmailEvent, string> = {
    'order-paid': seller ? 'Nuevo pedido pagado' : 'Pago confirmado',
    'order-pending': seller
      ? 'Nuevo pedido pendiente de pago'
      : 'Pedido recibido · pendiente de pago',
    'payment-confirmed': 'Pago confirmado',
    'payment-review': seller ? 'Pago que requiere revisión' : 'Estamos revisando tu pago',
    'ready-for-pickup': 'Tu pedido está pronto para retirar',
    shipped: 'Tu pedido fue enviado',
  }
  let message =
    event === 'payment-review'
      ? 'El pago requiere revisión. Darsha verificará el pago y la disponibilidad antes de preparar el pedido.'
      : event === 'shipped'
        ? 'Tu pedido ya está en camino con UES Xpres.'
        : event === 'ready-for-pickup'
          ? 'Puedes retirar tu pedido en Darsha.'
          : order.paymentState === 'paid'
            ? 'Recibimos el pago de tu pedido. Gracias por tu compra.'
            : order.paymentProvider === 'cash'
              ? 'Tu pedido está pendiente de pago. Pagarás en efectivo al retirar.'
              : 'Tu pedido está pendiente de pago. Realiza la transferencia antes de retirarlo.'
  if (seller)
    message =
      event === 'payment-review'
        ? 'Revisa este pago y el stock antes de preparar o entregar el pedido.'
        : `Actualización del pedido de ${snapshot.contact.name}. Estado de pago: ${order.paymentState === 'paid' ? 'pagado' : 'pendiente o en revisión'}.`
  if (event === 'ready-for-pickup' && order.paymentState !== 'paid')
    message += ' El pedido sigue pendiente de pago.'
  const delivery =
    snapshot.delivery.method === 'pickup'
      ? 'Retiro en Darsha'
      : `${snapshot.delivery.street} ${snapshot.delivery.number}${snapshot.delivery.apartment ? ', ' + snapshot.delivery.apartment : ''}, ${snapshot.delivery.locality}, ${snapshot.delivery.department}, Uruguay`
  const details = [
    delivery,
    ...(snapshot.delivery.method === 'pickup' ? [pickup.address, pickup.hours] : []),
    ...(event === 'shipped' && order.trackingNumber
      ? [`Seguimiento UES: ${order.trackingNumber}`]
      : []),
    ...(order.paymentProvider === 'bank-transfer' && order.paymentState === 'pending'
      ? [bankInstructions || 'Contacta a Darsha para recibir las instrucciones de transferencia.']
      : []),
  ]
    .filter(Boolean)
    .map(String)
  if (seller)
    details.push(`Email: ${snapshot.contact.email}`, `Teléfono: ${snapshot.contact.phone}`)
  if (snapshot.delivery.notes) details.push(`Referencias: ${snapshot.delivery.notes}`)
  const subject = `Espacio Darsha · ${titles[event]} · Pedido #${order.id}`
  const items = snapshot.lines.map(
    (line) => `${line.title} × ${line.quantity} — ${formatUYU(line.unitPrice * line.quantity)}`,
  )
  const text = [
    subject,
    message,
    `Cliente: ${snapshot.contact.name}`,
    ...details,
    ...items,
    `Subtotal: ${formatUYU(snapshot.subtotal)}`,
    `Envío: ${formatUYU(snapshot.shipping)}`,
    `Total del pedido: ${formatUYU(order.amount || 0)}`,
    'Importes en pesos uruguayos.',
    'Puedes responder a este correo para contactar a Darsha.',
  ].join('\n\n')
  const rows = snapshot.lines
    .map(
      (line) =>
        `<tr><td style="padding:12px 0;border-bottom:1px solid #D1C7C0">${escape(line.title)}<br><small>Cantidad: ${line.quantity}</small></td><td style="padding:12px 0;text-align:right;white-space:nowrap;border-bottom:1px solid #D1C7C0">${escape(formatUYU(line.unitPrice * line.quantity))}</td></tr>`,
    )
    .join('')
  const html = `<html lang="es"><body style="margin:0;background:#CEC3BA;color:#3D393A;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td style="padding:24px"><div style="max-width:600px;margin:auto;background:#E8E3DD;padding:28px"><p style="letter-spacing:2px">ESPACIO DARSHA</p><h1 style="font-family:Georgia,serif;font-weight:normal">${escape(titles[event])}</h1><p>Pedido #${order.id}</p><p>${escape(message)}</p><p>${escape(snapshot.contact.name)}</p>${details.map((detail) => `<p>${escape(detail)}</p>`).join('')}<table width="100%" style="border-collapse:collapse">${rows}</table><p>Subtotal: ${escape(formatUYU(snapshot.subtotal))}</p><p>Envío: ${escape(formatUYU(snapshot.shipping))}</p><p style="font-size:22px"><strong>Total del pedido: ${escape(formatUYU(order.amount || 0))}</strong></p><small>Importes en pesos uruguayos.</small><p>Puedes responder a este correo para contactar a Darsha.</p></div></td></tr></table></body></html>`
  return { subject, text, html }
}
