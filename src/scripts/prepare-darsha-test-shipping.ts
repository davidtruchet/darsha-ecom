/** Temporary testing weights, not measured product specifications. Fill only unset values. */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import sample from '../../docs/catalog-research/sample.json'
import { calculateShippingQuote } from '../utilities/shippingQuote'

const weights: Record<string, number> = {
  'The Cream Fine Texture': 200,
  'Ice & Firm': 350,
  Retinight: 150,
  'Tratamiento Labial con Ácido Hialurónico': 60,
  'Stick Protector Invisible SPF50+': 100,
  'Sérum Firmeza y Vitalidad': 150,
  'Niacinamide+ Micellar Water': 300,
  'Niacinamide+ Serum': 150,
  'Niacinamide+ Cream': 200,
  'Vita B12+ Eye Contour': 80,
  'Vita B12+ Cream': 200,
  'Vita B12+ Emulsion': 150,
}
const payload = await getPayload({ config })
for (const item of sample.products) {
  const result = await payload.find({
    collection: 'products',
    draft: true,
    limit: 2,
    where: { sourceURL: { equals: item.sourceURL } },
  })
  if (result.docs.length !== 1 || !weights[item.title])
    throw new Error(`Unexpected sample: ${item.title}`)
  const product = result.docs[0]
  if (product.shippingWeightGrams == null) {
    await payload.update({
      collection: 'products',
      id: product.id,
      context: { disableRevalidate: true },
      data: { shippingWeightGrams: weights[item.title] },
    })
    payload.logger.info(`Test weight: ${product.title} — ${weights[item.title]} g`)
  } else payload.logger.info(`Existing weight preserved: ${product.title}`)
}
let settings = await payload.findGlobal({ slug: 'shipping' })
if (settings.packagingWeightGrams == null) {
  settings = await payload.updateGlobal({ slug: 'shipping', data: { packagingWeightGrams: 200 } })
  payload.logger.info('Test packaging weight: 200 g per parcel')
}
const product = await payload.find({
  collection: 'products',
  where: { sourceURL: { equals: sample.products[0].sourceURL } },
  limit: 1,
})
if (!product.docs[0]) throw new Error('Published verification product missing')
for (const quantity of [1, 10]) {
  const quote = calculateShippingQuote(
    { method: 'delivery', department: 'Montevideo', locality: 'Montevideo' },
    [{ product: product.docs[0], quantity }],
    settings,
  )
  if (!quote.available) throw new Error(quote.message)
  payload.logger.info(
    `Verified ${quantity} units: ${quote.weightGrams} g, UYU ${quote.amount / 100}`,
  )
}
await payload.destroy()
process.exit(0)
