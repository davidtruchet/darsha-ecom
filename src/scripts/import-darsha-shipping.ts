/** Seed reviewed Xpres home tariffs without overwriting an existing configuration or guessing weights. */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import source from '../../docs/shipping-research/xpres-public-tariffs.json'

const payload = await getPayload({ config })
const existing = await payload.findGlobal({ slug: 'shipping' })
if (!existing.rates?.length) {
  const montevideo = source.rates.find(
    (rate) => rate.service === 'home-delivery' && rate.publishedZone === 'Montevideo',
  )!
  const interior = source.rates.find(
    (rate) => rate.service === 'home-delivery' && rate.publishedZone === 'Interior',
  )!
  await payload.updateGlobal({
    slug: 'shipping',
    data: {
      sourceURL: source.sourceURL,
      reviewedAt: source.observedAt,
      rates: source.weightLimitsKg.map((weight, index) => ({
        maxWeightGrams: weight * 1000,
        montevideoPrice: montevideo.pricesInCentésimos[index],
        interiorPrice: interior.pricesInCentésimos[index],
      })),
    },
  })
  payload.logger.info('Imported Xpres home tariffs. Product and packaging weights remain unset.')
} else payload.logger.info('Existing shipping tariffs preserved.')
await payload.destroy()
process.exit(0)
