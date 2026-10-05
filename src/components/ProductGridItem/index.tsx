import type { Product } from '@/payload-types'
import Link from 'next/link'
import Image from 'next/image'
import { formatUYU } from '@/lib/currencies'

export function ProductGridItem({ product }: { product: Partial<Product> }) {
  const image = product.gallery?.[0]?.image
  const brand = product.brand && typeof product.brand === 'object' ? product.brand.title : null
  const price = product.priceInUYUEnabled ? product.priceInUYU : null
  const discounted =
    typeof price === 'number' &&
    typeof product.compareAtPriceInUYU === 'number' &&
    product.compareAtPriceInUYU > price
  return (
    <Link href={`/products/${product.slug}`} className="group block text-[#3D393A]">
      <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-white">
        {image && typeof image === 'object' && image.url ? (
          <Image
            src={image.url}
            alt={image.alt || product.title || 'Producto'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-6 transition-transform group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[#4b5563]">
            Imagen próximamente
          </span>
        )}
        {discounted && (
          <span className="absolute left-3 top-3 rounded bg-[#3D393A] px-3 py-1 text-sm text-white">
            Promoción
          </span>
        )}
      </div>
      {brand && <p className="mb-1 text-sm text-[#4b5563]">{brand}</p>}
      <h3 className="text-lg font-medium">{product.title}</h3>
      {product.size && <p className="mt-1 text-sm text-[#4b5563]">{product.size}</p>}
      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        {typeof price === 'number' ? (
          <span>{formatUYU(price)}</span>
        ) : (
          <span className="text-sm text-[#4b5563]">Precio por confirmar</span>
        )}
        {discounted && (
          <del className="text-sm text-[#4b5563]">{formatUYU(product.compareAtPriceInUYU!)}</del>
        )}
      </div>
      <span className="mt-4 inline-block text-sm underline underline-offset-4">Ver producto</span>
    </Link>
  )
}
