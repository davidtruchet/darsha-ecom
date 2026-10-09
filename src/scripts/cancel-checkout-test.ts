/** Cancel only an explicitly selected synthetic browser test order and return its reservation. */
import 'dotenv/config'
import { getPayload, createLocalReq } from 'payload'
import config from '@payload-config'
import { releaseAttempt } from '../lib/checkout/settlement'
import type { CheckoutSnapshot } from '../lib/checkout/types'

const reference = process.argv[2]
if (!reference) throw new Error('Provide a test checkout reference')
const payload = await getPayload({ config })
const attempt = (
  await payload.find({
    collection: 'checkout-attempts',
    limit: 1,
    depth: 0,
    where: { reference: { equals: reference } },
  })
).docs[0]
if (
  !attempt ||
  (attempt.snapshot as unknown as CheckoutSnapshot).contact.email !==
    'checkout-verification@example.com' ||
  attempt.method !== 'cash' ||
  attempt.state !== 'pending'
)
  throw new Error('Not a pending synthetic cash checkout')
await releaseAttempt(await createLocalReq({}, payload), attempt.id, 'cancelled')
payload.logger.info('Synthetic browser order cancelled; reservation returned to stock.')
await payload.destroy()
process.exit(0)
