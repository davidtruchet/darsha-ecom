'use client'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useId, useRef, useState } from 'react'
import { useShipping } from '@/providers/Shipping'
import { formatUYU } from '@/lib/currencies'
import { uruguayDepartments } from '@/utilities/shippingQuote'

export function ShippingEstimator() {
  const { cart } = useCart()
  const id = useId()
  const { destination, setDestination, result, setResult } = useShipping()
  const { method, department, locality } = destination
  const [error, setError] = useState<{ key: string; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const requestID = useRef(0)
  const key = JSON.stringify([cart?.id, cart?.updatedAt, cart?.items, method, department, locality])
  const quote = result?.key === key ? result.quote : null
  async function calculate() {
    const request = ++requestID.current
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      let secret: string | null = null
      try {
        secret = localStorage.getItem('cart_secret')
      } catch {
        /* Signed-in carts can use cookies. */
      }
      const response = await fetch('/api/shipping/quote', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartID: cart?.id,
          secret,
          destination: { method, department, locality },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'No pudimos calcular el envío.')
      if (request === requestID.current) setResult({ key, quote: body })
    } catch (cause) {
      if (request === requestID.current)
        setError({
          key,
          message: cause instanceof Error ? cause.message : 'No pudimos calcular el envío.',
        })
    } finally {
      if (request === requestID.current) setLoading(false)
    }
  }
  const field = 'mt-1 w-full rounded-sm border border-[#3D393A]/30 bg-[#fafaf9] p-2'
  return (
    <section className="space-y-3 border-t border-[#D1C7C0] pt-4" aria-label="Calcular envío">
      <h2 className="font-darsha-serif text-xl">Entrega o retiro</h2>
      <label className="block text-sm" htmlFor={`${id}-method`}>
        ¿Cómo quieres recibir tu pedido?
        <select
          id={`${id}-method`}
          name="delivery-method"
          autoComplete="off"
          className={`${field} darsha-select`}
          value={method}
          onChange={(event) => {
            setDestination((current) => ({
              ...current,
              method: event.target.value as 'pickup' | 'delivery',
            }))
            setError(null)
          }}
        >
          <option value="pickup">Retiro gratis en Darsha</option>
          <option value="delivery">Entrega a domicilio</option>
        </select>
      </label>
      {method === 'delivery' && (
        <>
          <label className="block text-sm" htmlFor={`${id}-department`}>
            Departamento
            <select
              id={`${id}-department`}
              name="department"
              autoComplete="shipping address-level1"
              className={`${field} darsha-select`}
              value={department}
              onChange={(event) => {
                setDestination((current) => ({
                  ...current,
                  department: event.target.value,
                  locality: '',
                }))
                setError(null)
              }}
            >
              <option value="">Seleccionar departamento</option>
              {uruguayDepartments.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm" htmlFor={`${id}-locality`}>
            Localidad
            <input
              id={`${id}-locality`}
              name="locality"
              type="text"
              autoComplete="shipping address-level2"
              className={field}
              maxLength={150}
              value={locality}
              onChange={(event) => {
                setDestination((current) => ({ ...current, locality: event.target.value }))
                setError(null)
              }}
            />
          </label>
          <p className="text-xs text-[#4b5563]">
            Entrega gratis en las ciudades de Punta del Este y Maldonado. Otras localidades: UES
            Xpres a domicilio.
          </p>
        </>
      )}
      <button
        type="button"
        disabled={
          loading || !cart?.id || (method === 'delivery' && (!department || !locality.trim()))
        }
        onClick={calculate}
        className="w-full border border-[#3D393A] px-3 py-2 text-sm disabled:opacity-40"
      >
        {loading ? 'Calculando…' : 'Calcular envío'}
      </button>
      <div aria-live="polite">
        {quote &&
          (quote.available ? (
            <p className="text-sm">
              {quote.service === 'darsha-pickup'
                ? 'Retiro en Darsha'
                : quote.service === 'darsha-local'
                  ? 'Entrega local'
                  : 'Entrega UES Xpres'}
              : <strong>{quote.amount === 0 ? 'Gratis' : formatUYU(quote.amount)}</strong>
            </p>
          ) : (
            <p className="text-sm text-red-900">{quote.message}</p>
          ))}
      </div>
      {error?.key === key && (
        <p role="alert" className="text-sm text-red-900">
          {error.message}
        </p>
      )}
      <p className="text-xs text-[#4b5563]">
        Estimación para una caja por pedido. La dirección y el costo se verificarán al finalizar la
        compra.
      </p>
    </section>
  )
}
