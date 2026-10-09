'use client'

import type { Product } from '@/payload-types'
import { getProductPurchaseState } from '@/utilities/productPurchase'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export function AddToCart({ product }: { product: Product }) {
  const { addItem, cart, isLoading } = useCart()
  const params = useSearchParams()
  const [quantity, setQuantity] = useState(1)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const notifiedAttempt = useRef<object | null>(null)
  const [attempt, setAttempt] = useState<{ expected: number; added: number } | null>(null)
  const { selectedVariant, remaining, cartQuantity, reason } = getProductPurchaseState(
    product,
    params.get('variant'),
    cart?.items || [],
  )
  const max = Math.max(1, remaining)
  const value = Math.min(quantity, max)
  const busy = pending || isLoading

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (reason || busy || value < 1 || value > remaining) return
    setPending(true)
    setMessage('')
    setAttempt(null)
    try {
      await addItem({ product: product.id, variant: selectedVariant?.id }, value)
      // The ecommerce provider can resolve after swallowing an API error.
      // Confirm the resulting cart quantity before reporting success.
      setAttempt({ expected: cartQuantity + value, added: value })
    } catch {
      const error =
        'No pudimos agregar el producto. Revisa la disponibilidad e inténtalo nuevamente.'
      setMessage(error)
      toast.error(error)
    } finally {
      setPending(false)
    }
  }

  const attemptSucceeded = !!attempt && cartQuantity >= attempt.expected
  const attemptMessage = attempt
    ? attemptSucceeded
      ? attempt.added === 1
        ? 'Producto agregado al carrito.'
        : `${attempt.added} unidades agregadas al carrito.`
      : 'No pudimos agregar el producto. Revisa la disponibilidad e inténtalo nuevamente.'
    : ''

  useEffect(() => {
    if (!attempt || isLoading) return
    if (notifiedAttempt.current !== attempt) {
      notifiedAttempt.current = attempt
      if (attemptSucceeded) toast.success(attemptMessage)
      else toast.error(attemptMessage)
    }
    const timer = setTimeout(() => setAttempt(null), 5000)
    return () => clearTimeout(timer)
  }, [attempt, attemptSucceeded, attemptMessage, isLoading])

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label htmlFor={`quantity-${product.id}`} className="text-sm font-medium">
        Cantidad
      </label>
      <div className="flex flex-wrap items-stretch gap-4">
        <div className="flex rounded border border-[#D1C7C0] bg-white">
          <button
            type="button"
            aria-label="Disminuir cantidad"
            disabled={!!reason || busy || value <= 1}
            onClick={() => setQuantity(value - 1)}
            className="px-4 disabled:opacity-40"
          >
            −
          </button>
          <input
            id={`quantity-${product.id}`}
            name="quantity"
            type="number"
            min={1}
            max={max}
            step={1}
            value={value}
            disabled={!!reason || busy}
            onChange={(event) => {
              const next = Number(event.target.value)
              setQuantity(Number.isFinite(next) ? Math.min(max, Math.max(1, Math.floor(next))) : 1)
            }}
            className="w-14 bg-white py-3 text-center text-[#3D393A] disabled:opacity-60"
          />
          <button
            type="button"
            aria-label="Aumentar cantidad"
            disabled={!!reason || busy || value >= max}
            onClick={() => setQuantity(value + 1)}
            className="px-4 disabled:opacity-40"
          >
            +
          </button>
        </div>
        <button
          type="submit"
          disabled={!!reason || busy}
          className="grow rounded bg-[#3D393A] px-6 py-3 text-white hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Agregando…' : 'Agregar al carrito'}
        </button>
      </div>
      <p role="status" aria-live="polite" className="text-sm text-[#4b5563]">
        {message || attemptMessage || reason}
      </p>
    </form>
  )
}
