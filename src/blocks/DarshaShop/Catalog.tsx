import type { Where } from 'payload'
import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { formatUYU } from '@/lib/currencies'

export type CatalogSearchParams = Record<string, string | string[] | undefined>
const scalar = (value: string | string[] | undefined) => (typeof value === 'string' ? value : '')
const sorting: Record<string, string> = {
  name: 'title',
  newest: '-createdAt',
  priceAsc: 'priceInUYU',
  priceDesc: '-priceInUYU',
}

export async function DarshaProductCatalogBlock({
  heading,
  pageSize,
  emptyMessage,
  catalogSearchParams = {},
}: {
  heading: string
  pageSize: number
  emptyMessage: string
  catalogSearchParams?: CatalogSearchParams
}) {
  const payload = await getPayload({ config })
  const { isEnabled: draft } = await draftMode()
  const q = scalar(catalogSearchParams.q).trim().slice(0, 120)
  const category = scalar(catalogSearchParams.category)
  const brand = scalar(catalogSearchParams.brand)
  const sort =
    scalar(catalogSearchParams.sort) in sorting ? scalar(catalogSearchParams.sort) : 'name'
  const pageValue = Number(scalar(catalogSearchParams.page))
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1
  const [categories, brands] = await Promise.all([
    payload.find({
      collection: 'categories',
      pagination: false,
      sort: 'title',
      overrideAccess: false,
    }),
    payload.find({ collection: 'brands', pagination: false, sort: 'title', overrideAccess: false }),
  ])
  const categoryDoc = categories.docs.find((item) => item.slug === category)
  const brandDoc = brands.docs.find((item) => item.slug === brand)
  const conditions: Where[] = [
    { slug: { exists: true, not_equals: '' } },
    { title: { exists: true, not_equals: '' } },
    ...(!draft ? [{ _status: { equals: 'published' } }] : []),
    ...(q ? [{ or: [{ title: { like: q } }, { shortDescription: { like: q } }] }] : []),
    ...(categoryDoc ? [{ categories: { contains: categoryDoc.id } }] : []),
    ...(brandDoc ? [{ brand: { equals: brandDoc.id } }] : []),
  ]
  const products = await payload.find({
    collection: 'products',
    draft,
    overrideAccess: draft,
    depth: 1,
    limit: Math.max(1, Math.min(48, pageSize)),
    page,
    sort: sorting[sort],
    where: conditions.length ? { and: conditions } : undefined,
  })
  const pageURL = (nextPage: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (categoryDoc) params.set('category', category)
    if (brandDoc) params.set('brand', brand)
    params.set('sort', sort)
    params.set('page', String(nextPage))
    return `/shop?${params}#catalogo`
  }

  return (
    <section id="catalogo" className="bg-[#fafaf9] py-16 text-[#3D393A]">
      <div className="darsha-container">
        <h2 className="font-darsha-serif mb-8 text-3xl md:text-4xl">{heading}</h2>
        {draft && (
          <p className="mb-6 rounded border border-[#D1C7C0] p-3">
            Vista previa: incluye productos en borrador. Los visitantes solo ven productos
            publicados.
          </p>
        )}
        <form
          key={`${q}:${category}:${brand}:${sort}`}
          action="/shop#catalogo"
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
        >
          <label className="flex flex-col gap-2 text-sm">
            Buscar productos
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Nombre o descripción"
              maxLength={120}
              className="rounded border border-[#D1C7C0] bg-white p-3"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Categoría
            <select
              name="category"
              defaultValue={categoryDoc ? category : ''}
              className="darsha-select rounded border border-[#D1C7C0] bg-white p-3"
            >
              <option value="">Todas las categorías</option>
              {categories.docs.map((item) => (
                <option key={item.id} value={item.slug || ''}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Marca
            <select
              name="brand"
              defaultValue={brandDoc ? brand : ''}
              className="darsha-select rounded border border-[#D1C7C0] bg-white p-3"
            >
              <option value="">Todas las marcas</option>
              {brands.docs.map((item) => (
                <option key={item.id} value={item.slug || ''}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Ordenar por
            <select
              name="sort"
              defaultValue={sort}
              className="darsha-select rounded border border-[#D1C7C0] bg-white p-3"
            >
              <option value="name">Nombre</option>
              <option value="newest">Más recientes</option>
              <option value="priceAsc">Menor precio</option>
              <option value="priceDesc">Mayor precio</option>
            </select>
          </label>
          <button
            type="submit"
            className="self-end rounded bg-[#3D393A] px-6 py-3 text-white hover:bg-[#1f2937]"
          >
            Aplicar
          </button>
        </form>
        {(q || categoryDoc || brandDoc) && (
          <Link href="/shop#catalogo" className="mb-6 inline-block underline underline-offset-4">
            Limpiar filtros
          </Link>
        )}
        <p role="status" className="mb-6 text-sm text-[#4b5563]">
          {products.totalDocs} {products.totalDocs === 1 ? 'producto' : 'productos'}
        </p>
        {products.docs.length === 0 ? (
          <p className="rounded border border-[#D1C7C0] bg-white p-8">
            {q || categoryDoc || brandDoc
              ? 'No encontramos productos con esos filtros. Prueba otra búsqueda.'
              : page > 1
                ? 'Esta página no contiene productos.'
                : emptyMessage}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.docs.map((product) => {
              const image = product.gallery?.[0]?.image
              const brandName =
                product.brand && typeof product.brand === 'object' ? product.brand.title : null
              const price = product.priceInUYUEnabled ? product.priceInUYU : null
              const discounted =
                typeof price === 'number' &&
                typeof product.compareAtPriceInUYU === 'number' &&
                product.compareAtPriceInUYU > price
              return (
                <Link
                  href={`/products/${product.slug}`}
                  key={product.id}
                  className="group rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3D393A]"
                >
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-white">
                    {image && typeof image === 'object' && image.url ? (
                      <Image
                        src={image.url}
                        alt={image.alt || product.title}
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
                  {brandName && <p className="mb-1 text-sm text-[#4b5563]">{brandName}</p>}
                  <h3 className="text-lg font-medium">{product.title}</h3>
                  {product.size && <p className="mt-1 text-sm text-[#4b5563]">{product.size}</p>}
                  <div className="mt-3 flex flex-wrap items-baseline gap-3">
                    {typeof price === 'number' ? (
                      <span>{formatUYU(price)}</span>
                    ) : (
                      <span className="text-sm text-[#4b5563]">Precio por confirmar</span>
                    )}
                    {discounted && (
                      <del className="text-sm text-[#4b5563]">
                        {formatUYU(product.compareAtPriceInUYU!)}
                      </del>
                    )}
                  </div>
                  <span className="mt-4 inline-block text-sm underline underline-offset-4">
                    Ver producto
                  </span>
                </Link>
              )
            })}
          </div>
        )}
        {(products.hasPrevPage || products.hasNextPage || page > 1) && (
          <nav
            aria-label="Páginas de productos"
            className="mt-12 flex items-center justify-center gap-6"
          >
            {page > 1 && (
              <Link href={pageURL(page - 1)} className="underline">
                Anterior
              </Link>
            )}
            <span>
              Página {page} de {Math.max(1, products.totalPages)}
            </span>
            {products.hasNextPage && (
              <Link href={pageURL(page + 1)} className="underline">
                Siguiente
              </Link>
            )}
          </nav>
        )}
      </div>
    </section>
  )
}
