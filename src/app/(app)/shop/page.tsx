import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { CatalogSearchParams } from '@/blocks/DarshaShop/Catalog'
import { generateMeta } from '@/utilities/generateMeta'
import config from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function shopPage() {
  const payload = await getPayload({ config })
  const { isEnabled: draft } = await draftMode()
  const result = await payload.find({
    collection: 'pages',
    draft,
    overrideAccess: draft,
    limit: 1,
    where: {
      and: [
        { slug: { equals: 'shop' } },
        ...(!draft ? [{ _status: { equals: 'published' } }] : []),
      ],
    },
  })
  return result.docs[0]
}

export async function generateMetadata() {
  const page = await shopPage()
  return page ? generateMeta({ doc: page }) : { title: 'Tienda | Espacio Darsha' }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>
}) {
  const page = await shopPage()
  if (!page) notFound()
  return (
    <article>
      <RenderBlocks blocks={page.layout} catalogSearchParams={await searchParams} />
    </article>
  )
}
