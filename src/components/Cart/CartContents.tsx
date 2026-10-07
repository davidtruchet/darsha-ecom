'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatUYU } from '@/lib/currencies'
import { summarizeCart } from '@/utilities/cartSummary'
import type { CartItem } from './index'
import { ShippingEstimator } from './ShippingEstimator'

const linkClass =
  'block rounded-sm bg-[#3D393A] px-5 py-3 text-center text-[#fafaf9] hover:opacity-80'

export function CartContents({
  drawer = false,
  onNavigate,
}: {
  drawer?: boolean
  onNavigate?: () => void
}) {
  const { cart, isLoading, incrementItem, decrementItem, removeItem } = useCart()
  const items = useMemo(() => cart?.items || [], [cart?.items])
  const { lines, subtotal, incomplete } = summarizeCart(items)
  const [pending, setPending] = useState<{ id: string; quantity: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!pending || !settled) return
    const current = items.find((item) => item.id === pending.id)
    if ((current?.quantity || 0) === pending.quantity) {
      const cleanup = setTimeout(() => setPending(null), 0)
      return () => clearTimeout(cleanup)
    }
    const timeout = setTimeout(
      () =>
        setError('No pudimos actualizar el carrito. Actualiza los productos e intenta nuevamente.'),
      1500,
    )
    return () => clearTimeout(timeout)
  }, [items, pending, settled])

  async function change(item: CartItem, action: 'plus' | 'minus' | 'remove') {
    if (!item.id || pendingRef.current || isLoading) return
    pendingRef.current = true
    setError(null)
    setSettled(false)
    setPending({
      id: item.id,
      quantity: action === 'remove' ? 0 : item.quantity + (action === 'plus' ? 1 : -1),
    })
    try {
      await (action === 'remove'
        ? removeItem(item.id)
        : action === 'plus'
          ? incrementItem(item.id)
          : decrementItem(item.id))
    } catch {
      setError('No pudimos actualizar el carrito. Intenta nuevamente.')
    } finally {
      pendingRef.current = false
      setSettled(true)
    }
  }

  const busy = isLoading || (!!pending && !settled)
  return (
    <div
      aria-busy={busy}
      className={drawer ? 'space-y-6' : 'grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]'}
    >
      <div>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-sm border border-red-800 p-3 text-sm text-red-900"
          >
            {error}
            <button
              type="button"
              disabled={busy}
              className="mt-2 block underline"
              onClick={() => window.location.reload()}
            >
              Actualizar productos
            </button>
          </div>
        )}
        {!items.length ? (
          <div className="flex flex-col items-center gap-4 rounded-sm bg-[#E8E3DD] px-6 py-12 text-center">
            <ShoppingCart className="size-10" />
            <p className="font-darsha-serif text-2xl">Tu carrito está vacío</p>
            <p className="text-sm text-[#4b5563]">
              Encuentra el cuidado ideal para tu piel en nuestra tienda.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#D1C7C0] rounded-sm bg-[#E8E3DD] px-4">
            {items.map((item, index) => {
              const { product, variant, price, inventory, warning, total } = lines[index]
              const variantImage =
                variant &&
                product?.gallery?.find((entry) => {
                  const id =
                    typeof entry.variantOption === 'object'
                      ? entry.variantOption?.id
                      : entry.variantOption
                  return (
                    id &&
                    variant.options?.some(
                      (option) => (typeof option === 'object' ? option.id : option) === id,
                    )
                  )
                })?.image
              const imageRef = variantImage || product?.gallery?.[0]?.image || product?.meta?.image
              const image = imageRef && typeof imageRef === 'object' ? imageRef : null
              const brand =
                product?.brand && typeof product.brand === 'object' ? product.brand.title : null
              const details = (
                <>
                  <span className="block font-darsha-serif text-xl">
                    {product?.title || 'Producto no disponible'}
                  </span>
                  {brand && <span className="block text-xs uppercase tracking-wide">{brand}</span>}
                </>
              )
              return (
                <li key={item.id || index} className="flex gap-4 py-6">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-[#fafaf9]">
                    {image?.url && (
                      <Image
                        src={image.url}
                        alt={image.alt || product?.title || ''}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {product?.slug && product._status === 'published' ? (
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={onNavigate}
                        className="hover:opacity-70"
                      >
                        {details}
                      </Link>
                    ) : (
                      details
                    )}
                    {product?.size && <p className="mt-1 text-sm text-[#4b5563]">{product.size}</p>}
                    {variant && (
                      <p className="text-sm text-[#4b5563]">
                        {variant.options
                          ?.map((option) => (typeof option === 'object' ? option.label : ''))
                          .filter(Boolean)
                          .join(', ') || variant.title}
                      </p>
                    )}
                    <p className="mt-2 text-sm">
                      {price === null ? 'Precio por confirmar' : `${formatUYU(price)} por unidad`}
                    </p>
                    {warning && (
                      <p role="status" className="mt-2 text-sm text-red-900">
                        {warning}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center border border-[#3D393A]/30">
                        <button
                          type="button"
                          aria-label={`Reducir cantidad de ${product?.title || 'producto'}`}
                          disabled={busy || !item.id || item.quantity <= 1}
                          onClick={() => change(item, 'minus')}
                          className="p-2 disabled:opacity-30"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span aria-live="polite" className="min-w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Aumentar cantidad de ${product?.title || 'producto'}`}
                          disabled={busy || !item.id || !!warning || item.quantity >= inventory}
                          onClick={() => change(item, 'plus')}
                          className="p-2 disabled:opacity-30"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={busy || !item.id}
                        onClick={() => change(item, 'remove')}
                        aria-label={`Eliminar ${product?.title || 'producto'}`}
                        className="flex items-center gap-1 text-sm underline disabled:opacity-30"
                      >
                        <Trash2 className="size-4" />
                        Eliminar
                      </button>
                    </div>
                    {total !== null && (
                      <p className="mt-3 text-right font-medium">{formatUYU(total)}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <aside className="h-fit space-y-4 rounded-sm bg-[#E8E3DD] p-5 lg:sticky lg:top-32">
        {!!items.length && (
          <>
            <div className="flex justify-between gap-4 text-lg">
              <span>{incomplete ? 'Subtotal de productos con precio' : 'Subtotal'}</span>
              <span>{formatUYU(subtotal)}</span>
            </div>
            <p className="text-sm text-[#4b5563]">
              Precios en pesos uruguayos. El envío se definirá al finalizar la compra.
            </p>
            {incomplete && (
              <p className="text-sm text-red-900">Hay productos pendientes de precio.</p>
            )}
            {cart?.currency && cart.currency !== 'UYU' && (
              <p className="text-sm text-red-900">
                Este carrito usa otra moneda. Los importes mostrados corresponden a los precios
                actuales en UYU.
              </p>
            )}
            <p className="text-xs text-[#4b5563]">
              Los precios y la disponibilidad se actualizan al modificar el carrito.
            </p>
          </>
        )}
        {!!items.length && <ShippingEstimator />}
        {drawer && !!items.length && (
          <Link
            href="/cart"
            onClick={onNavigate}
            className="block border border-[#3D393A] px-5 py-3 text-center"
          >
            Ver carrito
          </Link>
        )}
        {!!items.length && <Link href="/checkout" onClick={onNavigate} className={linkClass}>Finalizar compra</Link>}
        <Link href="/shop" onClick={onNavigate} className={linkClass}>
          Continuar comprando
        </Link>
      </aside>
    </div>
  )
}
