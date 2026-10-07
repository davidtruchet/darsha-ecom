import { Suspense } from 'react'
import { CheckoutResult } from '@/components/checkout/CheckoutResult'
export const metadata = { title: 'Tu pedido', robots: { index: false, follow: false } }
export default function ResultPage() {
  return (
    <Suspense fallback={<p className="darsha-container py-16">Consultando tu pedido…</p>}>
      <CheckoutResult />
    </Suspense>
  )
}
