import type { CheckoutContact, CheckoutDelivery } from './types'
import { normalizeCheckoutPhone } from '@/utilities/checkoutPhone'
import { uruguayDepartments } from '@/utilities/shippingQuote'

export function validateCheckoutInput(
  contact: CheckoutContact,
  delivery: CheckoutDelivery,
  method: string,
) {
  if (!contact || !delivery || !['mercadopago', 'bank-transfer', 'cash'].includes(method))
    throw new Error('Completa los datos de la compra.')
  for (const value of [
    contact.name,
    contact.email,
    contact.phone,
    delivery.department,
    delivery.locality,
    delivery.street,
    delivery.number,
    delivery.apartment,
    delivery.notes,
  ])
    if (typeof value !== 'string' || value.length > 500)
      throw new Error('Datos de compra inválidos.')
  if (
    contact.name.trim().length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) ||
    contact.email.length > 254 ||
    !normalizeCheckoutPhone(contact.phone)
  )
    throw new Error('Revisa tu nombre, email y teléfono.')
  if (!['pickup', 'delivery'].includes(delivery.method))
    throw new Error('Selecciona entrega o retiro.')
  if (delivery.method === 'delivery') {
    if (method !== 'mercadopago')
      throw new Error('Las entregas a domicilio se pagan con Mercado Pago.')
    if (
      !uruguayDepartments.includes(delivery.department as (typeof uruguayDepartments)[number]) ||
      !delivery.locality.trim() ||
      !delivery.street.trim() ||
      !delivery.number.trim()
    )
      throw new Error('Completa la dirección de entrega.')
  }
}
