import type { Product, Shipping } from '@/payload-types'

export const uruguayDepartments = [
  'Artigas',
  'Canelones',
  'Cerro Largo',
  'Colonia',
  'Durazno',
  'Flores',
  'Florida',
  'Lavalleja',
  'Maldonado',
  'Montevideo',
  'Paysandú',
  'Río Negro',
  'Rivera',
  'Rocha',
  'Salto',
  'San José',
  'Soriano',
  'Tacuarembó',
  'Treinta y Tres',
] as const
export type ShippingDestination = {
  method: 'pickup' | 'delivery'
  department?: string
  locality?: string
}
export type ShippingLine = {
  product: Pick<Product, 'shippingWeightGrams'> | null
  quantity: number
}
export type ShippingQuote =
  | {
      available: true
      amount: number
      currency: 'UYU'
      service: 'darsha-pickup' | 'darsha-local' | 'ues-xpres-home'
      weightGrams?: number
      maxWeightGrams?: number
    }
  | { available: false; message: string }

export function calculateShippingQuote(
  destination: ShippingDestination,
  items: ShippingLine[],
  settings: Pick<Shipping, 'rates' | 'packagingWeightGrams'>,
): ShippingQuote {
  if (!items.length)
    return { available: false, message: 'Agrega productos al carrito para calcular el envío.' }
  if (destination.method === 'pickup')
    return { available: true, amount: 0, currency: 'UYU', service: 'darsha-pickup' }
  if (
    destination.method !== 'delivery' ||
    !uruguayDepartments.includes(destination.department as (typeof uruguayDepartments)[number]) ||
    !destination.locality?.trim()
  )
    return { available: false, message: 'Selecciona un departamento y una localidad de Uruguay.' }
  const locality = destination.locality
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
  if (destination.department === 'Maldonado' && ['punta del este', 'maldonado'].includes(locality))
    return { available: true, amount: 0, currency: 'UYU', service: 'darsha-local' }
  const rates = [...(settings.rates || [])].sort((a, b) => a.maxWeightGrams - b.maxWeightGrams)
  if (
    !rates.length ||
    rates.some(
      (rate, index) =>
        !Number.isSafeInteger(rate.maxWeightGrams) ||
        rate.maxWeightGrams <= 0 ||
        (index > 0 && rate.maxWeightGrams === rates[index - 1].maxWeightGrams) ||
        !Number.isSafeInteger(rate.montevideoPrice) ||
        rate.montevideoPrice < 0 ||
        !Number.isSafeInteger(rate.interiorPrice) ||
        rate.interiorPrice < 0,
    )
  )
    return { available: false, message: 'El tarifario de envío no está disponible.' }
  let missingWeight = false
  for (const item of items) {
    if (!item.product || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)
      return { available: false, message: 'Hay productos o cantidades no válidos para el envío.' }
    const weight = item.product.shippingWeightGrams
    if (weight == null) missingWeight = true
    else if (!Number.isSafeInteger(weight) || weight <= 0)
      return { available: false, message: 'Hay productos con peso de envío no válido.' }
  }
  // Temporary shop policy: use the first configured band when any product is unweighed.
  // Leave the actual weight unset rather than recording an estimated product weight.
  if (missingWeight) {
    const rate = rates[0]
    return {
      available: true,
      amount: destination.department === 'Montevideo' ? rate.montevideoPrice : rate.interiorPrice,
      currency: 'UYU',
      service: 'ues-xpres-home',
      maxWeightGrams: rate.maxWeightGrams,
    }
  }
  if (
    !Number.isSafeInteger(settings.packagingWeightGrams) ||
    (settings.packagingWeightGrams || 0) <= 0
  )
    return {
      available: false,
      message: 'El peso del embalaje aún no está configurado. No podemos cotizar este envío.',
    }
  let weightGrams = settings.packagingWeightGrams!
  for (const item of items) {
    weightGrams += item.product!.shippingWeightGrams! * item.quantity
    if (!Number.isSafeInteger(weightGrams))
      return { available: false, message: 'Este pedido requiere coordinación de envío.' }
  }
  const rate = rates.find((rate) => weightGrams <= rate.maxWeightGrams)
  if (!rate || weightGrams > 50000)
    return {
      available: false,
      message: 'Este pedido supera el peso admitido. Necesitamos coordinar su envío.',
    }
  return {
    available: true,
    amount: destination.department === 'Montevideo' ? rate.montevideoPrice : rate.interiorPrice,
    currency: 'UYU',
    service: 'ues-xpres-home',
    weightGrams,
    maxWeightGrams: rate.maxWeightGrams,
  }
}
