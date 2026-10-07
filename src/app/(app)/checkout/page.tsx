import { CheckoutPage } from '@/components/checkout/CheckoutPage'
import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'
export default async function Checkout() {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'shipping', depth: 0 })
  return <CheckoutPage pickupAddress={settings.pickupAddress} pickupHours={settings.pickupHours} />
}
export const metadata = { title: 'Finalizar compra', robots: { index: false, follow: false } }
