'use client'

import type { Product, Variant } from '@/payload-types'
import { AddToCart } from '@/components/Cart/AddToCart'
import { formatUYU } from '@/lib/currencies'
import { getProductPurchaseState } from '@/utilities/productPurchase'
import { VariantSelector } from './VariantSelector'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export function ProductDescription({ product }: { product: Product }) {
  const params = useSearchParams()
  const { price, inventory, selectedVariant } = getProductPurchaseState(
    product,
    params.get('variant'),
  )
  const brand = product.brand && typeof product.brand === 'object' ? product.brand : null
  const variants = (product.variants?.docs || []).filter(
    (item): item is Variant => !!item && typeof item === 'object',
  )
  const prices = variants
    .filter(
      (item) =>
        item.priceInUYUEnabled && typeof item.priceInUYU === 'number' && item.priceInUYU >= 0,
    )
    .map((item) => item.priceInUYU!)
    .sort((a, b) => a - b)
  const range =
    product.enableVariants && !selectedVariant && prices.length
      ? prices[0] === prices[prices.length - 1]
        ? formatUYU(prices[0])
        : `${formatUYU(prices[0])} – ${formatUYU(prices[prices.length - 1])}`
      : null
  const discounted =
    !product.enableVariants &&
    price !== null &&
    typeof product.compareAtPriceInUYU === 'number' &&
    product.compareAtPriceInUYU > price

  return (
    <div className="flex flex-col gap-6 text-[#3D393A]">
      {brand && (
        <Link
          href={`/shop?brand=${encodeURIComponent(brand.slug || '')}#catalogo`}
          className="text-sm underline underline-offset-4"
        >
          {brand.title}
        </Link>
      )}
      <h1 className="font-darsha-serif text-4xl md:text-5xl">{product.title}</h1>
      {product.size && <p className="text-[#4b5563]">{product.size}</p>}
      {product.shortDescription && (
        <p className="leading-relaxed text-[#4b5563]">{product.shortDescription}</p>
      )}
      <div className="flex flex-wrap items-baseline gap-3" aria-live="polite">
        <span className="text-2xl">
          {range || (price !== null ? formatUYU(price) : 'Precio por confirmar')}
        </span>
        {discounted && (
          <>
            <del className="text-[#4b5563]">{formatUYU(product.compareAtPriceInUYU!)}</del>
            <span className="rounded bg-[#E8E3DD] px-3 py-1 text-sm">Promoción</span>
          </>
        )}
      </div>
      {product.enableVariants && <VariantSelector product={product} />}
      {(!product.enableVariants || selectedVariant) && (
        <p className="text-sm text-[#4b5563]">
          {inventory > 0 ? 'Disponible' : 'Sin stock por el momento'}
        </p>
      )}
      <AddToCart key={`${product.id}-${selectedVariant?.id || 'default'}`} product={product} />
    </div>
  )
}
