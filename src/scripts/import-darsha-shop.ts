/** Import a reviewed starting catalog as drafts. Never overwrite editorial changes. */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import sample from '../../docs/catalog-research/sample.json'

const payload = await getPayload({ config })
const context = { disableRevalidate: true }
const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
const categoryNames = [
  'Limpieza',
  'Cremas',
  'Sérums',
  'Contorno de ojos',
  'Protección solar',
  'Cuidado labial',
  'Cuidado corporal',
]
const categories = new Map<string, number>()
for (const title of categoryNames) {
  const slug = slugify(title)
  const existing = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const doc =
    existing.docs[0] || (await payload.create({ collection: 'categories', data: { title, slug } }))
  categories.set(title, doc.id)
}
const brands = new Map<string, number>()
for (const title of ['Lidherma', 'Germaine de Capuccini']) {
  const slug = slugify(title)
  const existing = await payload.find({
    collection: 'brands',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const doc =
    existing.docs[0] || (await payload.create({ collection: 'brands', data: { title, slug } }))
  brands.set(title, doc.id)
}
const germaineCategories: Record<string, string> = {
  'The Cream Fine Texture': 'Cremas',
  'Ice & Firm': 'Cremas',
  Retinight: 'Sérums',
  'Tratamiento Labial con Ácido Hialurónico': 'Cuidado labial',
  'Stick Protector Invisible SPF50+': 'Protección solar',
  'Sérum Firmeza y Vitalidad': 'Sérums',
}
let created = 0
let skipped = 0
for (const item of sample.products) {
  const slug = `${slugify(item.brand)}-${slugify(item.title)}`
  const existing = await payload.find({
    collection: 'products',
    draft: true,
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (existing.docs[0]) {
    skipped++
    continue
  }
  const source = new URL(item.imageURLs[0])
  if (source.protocol !== 'https:' || !['www.lidherma.uy', 'cfluna.com'].includes(source.hostname))
    throw new Error(`Unexpected image host for ${item.title}`)
  const response = await fetch(source, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Image download failed for ${item.title}: ${response.status}`)
  const mimetype = response.headers.get('content-type')?.split(';')[0] || ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimetype))
    throw new Error(`Unexpected image type for ${item.title}`)
  const data = Buffer.from(await response.arrayBuffer())
  if (data.length > 10 * 1024 * 1024) throw new Error(`Image too large for ${item.title}`)
  const extension = mimetype === 'image/png' ? 'png' : mimetype === 'image/webp' ? 'webp' : 'jpg'
  const filename = `${slug}.${extension}`
  const existingMedia = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  })
  const media =
    existingMedia.docs[0] ||
    (await payload.create({
      collection: 'media',
      data: { alt: `${item.title} — ${item.brand}` },
      file: { name: filename, data, mimetype, size: data.length },
    }))
  const sourceCategory =
    'proposedCategory' in item ? item.proposedCategory : germaineCategories[item.title]
  const categoryName = sourceCategory === 'Limpiadores' ? 'Limpieza' : sourceCategory
  if (!categoryName || !categories.has(categoryName))
    throw new Error(`Missing category for ${item.title}`)
  const sourcePrice = item.sourcePrice == null ? null : Number(item.sourcePrice)
  if (
    sourcePrice !== null &&
    (item.currency !== 'UYU' || !Number.isFinite(sourcePrice) || sourcePrice < 0)
  )
    throw new Error(`Invalid source price for ${item.title}`)
  const text = item.description || ''
  await payload.create({
    collection: 'products',
    draft: true,
    context,
    data: {
      title: item.title,
      slug,
      _status: 'draft',
      brand: brands.get(item.brand),
      categories: [categories.get(categoryName)!],
      shortDescription: text,
      description: {
        root: {
          type: 'root',
          version: 1,
          format: '',
          indent: 0,
          direction: 'ltr',
          children: [
            {
              type: 'paragraph',
              version: 1,
              format: '',
              indent: 0,
              direction: 'ltr',
              children: [
                { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
              ],
            },
          ],
        },
      },
      gallery: [{ image: media.id }],
      size: 'size' in item ? item.size : undefined,
      priceInUYUEnabled: sourcePrice !== null,
      priceInUYU: sourcePrice === null ? null : Math.round(sourcePrice * 100),
      enableVariants: false,
      inventory: 0,
      sourceURL: item.sourceURL,
      sourceSKU: 'sourceSKU' in item ? item.sourceSKU : undefined,
      sourceCapturedAt: sample.capturedAt,
    },
  })
  created++
  payload.logger.info(`Imported draft: ${item.title}`)
}
const shop = await payload.find({
  collection: 'pages',
  draft: true,
  where: { slug: { equals: 'shop' } },
  limit: 1,
})
if (!shop.docs[0]) {
  await payload.create({
    collection: 'pages',
    context,
    data: {
      title: 'Tienda',
      slug: 'shop',
      _status: 'published',
      hero: { type: 'none' },
      meta: {
        title: 'Tienda | Espacio Darsha',
        description: 'Productos para el cuidado de tu piel de Lidherma y Germaine de Capuccini.',
      },
      layout: [
        {
          blockType: 'darshaShopIntro',
          heading: 'Cuidado que acompaña tu piel',
          intro:
            'Descubre nuestra selección de productos de Lidherma y Germaine de Capuccini para sumar bienestar a tu rutina.',
        },
        {
          blockType: 'darshaProductCatalog',
          heading: 'Nuestros productos',
          pageSize: 12,
          emptyMessage:
            'Estamos preparando nuestra selección de productos para el cuidado de tu piel. Muy pronto podrás descubrirla aquí.',
        },
      ],
    },
  })
}
payload.logger.info(
  `Shop import complete: ${created} created, ${skipped} existing products preserved.`,
)
process.exit(0)
