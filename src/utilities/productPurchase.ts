import type { Product, Variant } from '@/payload-types'

type CartItem = {
  product: number | { id: number } | null
  variant?: number | { id: number } | null
  quantity: number
}

export function getProductPurchaseState(
  product: Product,
  variantID?: string | null,
  items: CartItem[] = [],
) {
  const variants = (product.variants?.docs || []).filter(
    (item): item is Variant => !!item && typeof item === 'object',
  )
  const selectedVariant = product.enableVariants
    ? variants.find((item) => String(item.id) === variantID)
    : undefined
  const purchasable = product.enableVariants ? selectedVariant : product
  const price =
    purchasable?.priceInUYUEnabled &&
    typeof purchasable.priceInUYU === 'number' &&
    Number.isFinite(purchasable.priceInUYU) &&
    purchasable.priceInUYU >= 0
      ? purchasable.priceInUYU
      : null
  const inventory = Math.max(0, Math.floor(purchasable?.inventory || 0))
  const cartQuantity = items.reduce((total, item) => {
    const productID = typeof item.product === 'object' ? item.product?.id : item.product
    const itemVariantID = typeof item.variant === 'object' ? item.variant?.id : item.variant
    return productID === product.id && (itemVariantID ?? undefined) === selectedVariant?.id
      ? total + item.quantity
      : total
  }, 0)
  const remaining = Math.max(0, inventory - cartQuantity)
  const reason =
    product.enableVariants && !selectedVariant
      ? 'Selecciona una presentación.'
      : price === null
        ? 'Precio por confirmar.'
        : inventory === 0
          ? 'Sin stock por el momento.'
          : remaining === 0
            ? 'Ya agregaste todas las unidades disponibles al carrito.'
            : product._status !== 'published'
              ? 'Este producto está en vista previa y aún no se puede comprar.'
              : null
  return { selectedVariant, price, inventory, remaining, cartQuantity, reason }
}
