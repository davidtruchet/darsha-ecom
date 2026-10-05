import type { Cart } from '@/payload-types'

export function describeCartItem(item: NonNullable<Cart['items']>[number]) {
  const product = item.product && typeof item.product === 'object' ? item.product : null
  const variant = item.variant && typeof item.variant === 'object' ? item.variant : null
  const target = item.variant ? variant : product?.enableVariants ? null : product
  const price =
    target?.priceInUYUEnabled &&
    typeof target.priceInUYU === 'number' &&
    Number.isFinite(target.priceInUYU) &&
    target.priceInUYU >= 0
      ? target.priceInUYU
      : null
  const inventory = Math.max(0, Math.floor(target?.inventory || 0))
  const warning =
    !product || product._status !== 'published' || (item.variant && !variant)
      ? 'Este producto ya no está disponible.'
      : price === null
        ? 'Precio por confirmar.'
        : inventory === 0
          ? 'Sin stock por el momento.'
          : item.quantity > inventory
            ? `Solo quedan ${inventory} unidades disponibles.`
            : null
  return {
    product,
    variant,
    price,
    inventory,
    warning,
    total: price === null ? null : price * item.quantity,
  }
}

export function summarizeCart(items: NonNullable<Cart['items']> = []) {
  const lines = items.map(describeCartItem)
  return {
    lines,
    subtotal: lines.reduce((sum, line) => sum + (line.total ?? 0), 0),
    incomplete: lines.some((line) => line.total === null),
  }
}
