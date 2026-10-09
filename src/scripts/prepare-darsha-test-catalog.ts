/** Development catalog setup: publishes reviewed samples and adds explicitly authorized test stock. */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import sample from '../../docs/catalog-research/sample.json'

const payload = await getPayload({ config })
for (const item of sample.products) {
  const found = await payload.find({
    collection: 'products',
    draft: true,
    limit: 2,
    where: { sourceURL: { equals: item.sourceURL } },
  })
  if (found.docs.length !== 1) throw new Error(`Expected one sample product: ${item.title}`)
  const product = found.docs[0]
  const priced =
    product.priceInUYUEnabled && typeof product.priceInUYU === 'number' && product.priceInUYU >= 0
  await payload.update({
    collection: 'products',
    id: product.id,
    context: { disableRevalidate: true },
    data: { _status: 'published', ...(priced ? { inventory: 10 } : {}) },
  })
  payload.logger.info(
    `Published ${product.title}${priced ? ' with 10 test units' : ' without a confirmed price'}`,
  )
}
await payload.destroy()

process.exit(0)
