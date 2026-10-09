import { CartContents } from '@/components/Cart/CartContents'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Carrito | Espacio Darsha',
  robots: { index: false, follow: false },
}

export default function CartPage() {
  return (
    <section className="darsha-container py-12 text-[#3D393A] md:py-20">
      <h1 className="mb-3 font-darsha-serif text-4xl md:text-5xl">Tu carrito</h1>
      <p className="mb-10 text-[#4b5563]">Tu próxima rutina de cuidado empieza aquí.</p>
      <CartContents />
    </section>
  )
}
