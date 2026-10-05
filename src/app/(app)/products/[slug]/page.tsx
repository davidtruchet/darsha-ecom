import type { Media, Product, Variant } from '@/payload-types'
import type { Metadata } from 'next'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { Gallery } from '@/components/product/Gallery'
import { ProductDescription } from '@/components/product/ProductDescription'
import { ProductDetails } from '@/components/product/ProductDetails'
import { ProductGridItem } from '@/components/ProductGridItem'
import config from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ChevronLeft } from 'lucide-react'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'
type Args = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const product = await queryProductBySlug(slug)
  if (!product) notFound()
  const image = product.gallery?.find((item) => item.image && typeof item.image === 'object')?.image
  const metaImage =
    product.meta?.image && typeof product.meta.image === 'object' ? product.meta.image : null
  const seoImage = metaImage || (image && typeof image === 'object' ? image : null)
  const { isEnabled: draft } = await draftMode()
  const canIndex = !draft && product._status === 'published'
  return {
    title: product.meta?.title || `${product.title} | Espacio Darsha`,
    description: product.meta?.description || product.shortDescription || '',
    openGraph: seoImage?.url
      ? {
          images: [
            {
              alt: seoImage.alt,
              url: seoImage.url,
              width: seoImage.width || undefined,
              height: seoImage.height || undefined,
            },
          ],
        }
      : undefined,
    robots: { index: canIndex, follow: canIndex },
  }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const product = await queryProductBySlug(slug)
  if (!product) notFound()
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config })
  const relatedIDs = (product.relatedProducts || [])
    .map((item) => (typeof item === 'object' ? item.id : item))
    .filter((id) => id !== product.id)
  const relatedResult = relatedIDs.length
    ? await payload.find({
        collection: 'products',
        draft,
        overrideAccess: draft,
        depth: 1,
        pagination: false,
        where: {
          and: [
            { id: { in: relatedIDs } },
            { slug: { exists: true, not_equals: '' } },
            { title: { exists: true, not_equals: '' } },
            ...(!draft ? [{ _status: { equals: 'published' } }] : []),
          ],
        },
      })
    : null
  const related = relatedIDs
    .map((id) => relatedResult?.docs.find((item) => item.id === id))
    .filter((item): item is Product => !!item)
  const gallery = (product.gallery || []).filter(
    (item) => item.image && typeof item.image === 'object',
  )
  const brand = product.brand && typeof product.brand === 'object' ? product.brand : null
  const image = gallery[0]?.image as Media | undefined
  const priceOptions = product.enableVariants
    ? (product.variants?.docs || []).filter(
        (item): item is Variant => !!item && typeof item === 'object',
      )
    : [product]
  const priced = priceOptions.filter(
    (item) =>
      item.priceInUYUEnabled &&
      typeof item.priceInUYU === 'number' &&
      Number.isFinite(item.priceInUYU) &&
      item.priceInUYU >= 0,
  )
  const prices = priced.map((item) => item.priceInUYU! / 100)
  const url = `${getServerSideURL()}/products/${encodeURIComponent(slug)}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.shortDescription || undefined,
    image: image?.url,
    url,
    ...(brand ? { brand: { '@type': 'Brand', name: brand.title } } : {}),
    ...(prices.length
      ? {
          offers: product.enableVariants
            ? {
                '@type': 'AggregateOffer',
                priceCurrency: 'UYU',
                lowPrice: Math.min(...prices),
                highPrice: Math.max(...prices),
                offerCount: prices.length,
                url,
              }
            : {
                '@type': 'Offer',
                priceCurrency: 'UYU',
                price: prices[0],
                url,
                availability:
                  product._status === 'published' && (product.inventory || 0) > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
              },
        }
      : {}),
  }

  return (
    <article className="bg-[#fafaf9] text-[#3D393A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="darsha-container py-10 md:py-16">
        <Link
          href="/shop#catalogo"
          className="mb-8 inline-flex items-center gap-2 text-sm underline underline-offset-4"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Volver a la tienda
        </Link>
        {draft && (
          <p className="mb-8 rounded border border-[#D1C7C0] p-3 text-sm">
            Vista previa del producto. Los productos en borrador no están disponibles para la
            compra.
          </p>
        )}
        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-12">
          <Suspense fallback={<div className="aspect-square rounded-lg bg-white" />}>
            <Gallery gallery={gallery} title={product.title} />
          </Suspense>
          <Suspense fallback={null}>
            <ProductDescription product={product} />
          </Suspense>
        </div>
        <ProductDetails product={product} />
      </div>
      {!!product.layout?.length && <RenderBlocks blocks={product.layout} />}
      {!!related.length && (
        <section className="darsha-container pb-16">
          <h2 className="font-darsha-serif mb-8 text-3xl">También te puede interesar</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductGridItem key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

async function queryProductBySlug(slug: string) {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'products',
    depth: 3,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [{ slug: { equals: slug } }, ...(!draft ? [{ _status: { equals: 'published' } }] : [])],
    },
    populate: {
      variants: {
        title: true,
        priceInUYU: true,
        priceInUYUEnabled: true,
        inventory: true,
        options: true,
      },
    },
  })
  return result.docs[0] || null
}
