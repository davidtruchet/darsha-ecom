'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSynchronizePaidCart } from '@/providers/CartSession'
import { Check, Loader2 } from 'lucide-react'
import { formatUYU } from '@/lib/currencies'
import type { CheckoutSnapshot } from '@/lib/checkout/types'

type Result = {
  reference: string
  state: string
  method: string
  amount: number
  orderID?: number
  checkoutURL?: string
  createdAt: string
  expiresAt: string
  snapshot: CheckoutSnapshot
  bankInstructions?: string
}
export function CheckoutResult() {
  const synchronizeCart = useSynchronizePaidCart()
  const search = useSearchParams()
  const reference = search.get('reference')
  const paymentID = search.get('payment_id') || search.get('collection_id')
  const [response, setResponse] = useState<{ reference: string | null; data: Result } | null>(null)
  const result = response?.reference === reference ? response.data : null
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const [settledRequest, setSettledRequest] = useState<string | null>(null)
  const requestKey = JSON.stringify([reference, paymentID, revision])
  const loading = settledRequest !== requestKey
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/checkout/status', {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, paymentID }),
    })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.message)
        return body
      })
      .then((body) => {
        setResponse({ reference, data: body })
        setError(null)
        if (body.state === 'paid' || (body.state === 'review' && body.orderID))
          synchronizeCart(body.reference)
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : 'No pudimos consultar tu pedido.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setSettledRequest(requestKey)
      })
    return () => controller.abort()
  }, [reference, paymentID, revision, requestKey, synchronizeCart])
  const heading =
    result?.state === 'paid'
      ? 'Pago confirmado'
      : result?.state === 'review'
        ? 'Estamos revisando tu pago'
        : result?.state === 'expired' || result?.state === 'cancelled'
          ? 'La reserva del pedido terminó'
          : result?.method === 'cash' || result?.method === 'bank-transfer'
            ? 'Pedido recibido'
            : 'Estamos verificando tu pago'
  return (
    <section className="darsha-container py-16 text-[#3D393A]">
      <div className="darsha-receipt mx-auto max-w-3xl space-y-8 rounded-sm bg-[#E8E3DD] p-6 md:p-10">
        <header className="border-b border-[#D1C7C0] pb-6">
          {result?.state === 'paid' && (
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#CEC3BA]">
              <Check aria-hidden="true" className="h-5 w-5" />
            </div>
          )}
          <h1 className="font-darsha-serif text-4xl">{heading}</h1>
          {result?.state === 'paid' && (
            <p className="mt-3 text-sm">Gracias por tu compra. Recibimos tu pago correctamente.</p>
          )}
        </header>
        <p className="hidden font-darsha-serif text-2xl print:block">
          Espacio Darsha · Comprobante de compra
        </p>
        {error && !loading && (
          <p role="alert" className="text-red-900">
            {error}
          </p>
        )}
        {result && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              {result.orderID && (
                <h2 className="font-darsha-serif text-2xl">Pedido #{result.orderID}</h2>
              )}
              <p className="text-sm text-[#3D393A]/75">
                {new Date(result.createdAt).toLocaleString('es-UY', {
                  timeZone: 'America/Montevideo',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="min-w-0">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-[#3D393A]/70">
                  Tus datos
                </h3>
                <p className="text-sm font-medium">{result.snapshot.contact.name}</p>
                <p className="mt-1 break-all text-sm">{result.snapshot.contact.email}</p>
                {result.snapshot.contact.phone && (
                  <p className="mt-1 text-sm">{result.snapshot.contact.phone}</p>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-[#3D393A]/70">
                  {result.snapshot.delivery.method === 'pickup' ? 'Retiro' : 'Entrega a domicilio'}
                </h3>
                {result.snapshot.delivery.method === 'pickup' ? (
                  <p className="text-sm">Retiro en Darsha</p>
                ) : (
                  <div className="space-y-1 text-sm">
                    <p>
                      {result.snapshot.delivery.street} {result.snapshot.delivery.number}
                      {result.snapshot.delivery.apartment
                        ? ` · Apartamento ${result.snapshot.delivery.apartment}`
                        : ''}
                    </p>
                    <p>
                      {result.snapshot.delivery.locality}
                      {result.snapshot.delivery.department !== result.snapshot.delivery.locality
                        ? `, ${result.snapshot.delivery.department}`
                        : ''}
                    </p>
                    <p>Uruguay</p>
                  </div>
                )}
              </div>
            </div>
            {result.state === 'pending' && (
              <p>
                {result.method === 'cash'
                  ? 'Pagarás en efectivo al retirar. Tu pedido sigue pendiente de pago.'
                  : result.method === 'bank-transfer'
                    ? 'Realiza la transferencia antes del retiro. Darsha confirmará la recepción del pago.'
                    : 'La confirmación puede demorar unos instantes. Puedes actualizar el estado.'}
              </p>
            )}
            {result.method === 'bank-transfer' && result.state === 'pending' && (
              <p className="whitespace-pre-line">
                {result.bankInstructions ||
                  'Darsha te enviará las instrucciones para la transferencia.'}
              </p>
            )}
            {['pending', 'initializing'].includes(result.state) && (
              <p className="text-sm">
                Reserva hasta{' '}
                {new Date(result.expiresAt).toLocaleString('es-UY', {
                  timeZone: 'America/Montevideo',
                })}
                .
              </p>
            )}
            {result.state === 'review' && (
              <p>Darsha verificará el pago y la disponibilidad antes de preparar el pedido.</p>
            )}
            {result.snapshot.delivery.method === 'pickup' &&
              ['paid', 'pending'].includes(result.state) && (
                <p>Te avisaremos cuando esté pronto para retirar.</p>
              )}
            <div className="border-y border-[#D1C7C0]">
              <div
                className="flex justify-between gap-4 py-3 text-xs font-medium uppercase tracking-widest text-[#3D393A]/70"
                aria-hidden="true"
              >
                <span>Productos</span>
                <span>Importe</span>
              </div>
              <ul className="divide-y divide-[#D1C7C0]">
                {result.snapshot.lines.map((line) => (
                  <li
                    key={`${line.product}:${line.variant || ''}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{line.title}</p>
                      <p className="mt-1 text-xs text-[#3D393A]/70">
                        Cantidad: {line.quantity} · {formatUYU(line.unitPrice)} c/u
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-right text-sm tabular-nums">
                      {formatUYU(line.unitPrice * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <dl className="ml-auto max-w-sm space-y-3">
              <div className="flex justify-between gap-6 text-sm">
                <dt>Subtotal</dt>
                <dd className="whitespace-nowrap tabular-nums">
                  {formatUYU(result.amount - result.snapshot.shipping)}
                </dd>
              </div>
              <div className="flex justify-between gap-6 text-sm">
                <dt>Envío</dt>
                <dd className="whitespace-nowrap tabular-nums">
                  {result.snapshot.shipping ? formatUYU(result.snapshot.shipping) : 'Gratis'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 border-t border-[#D1C7C0] pt-4">
                <dt className="font-darsha-serif text-2xl">Total</dt>
                <dd className="whitespace-nowrap text-xl font-medium tabular-nums">
                  {formatUYU(result.amount)}
                </dd>
              </div>
              <div className="text-right text-xs text-[#3D393A]/70">
                Todos los importes están en pesos uruguayos.
              </div>
            </dl>
            <p className="break-all border-t border-[#D1C7C0] pt-4 text-xs text-[#3D393A]/60">
              Referencia de pago: {result.reference}
            </p>
          </>
        )}
        {result?.state === 'pending' && result.method === 'mercadopago' && result.checkoutURL && (
          <a
            href={result.checkoutURL}
            className="print:hidden block rounded-sm bg-[#3D393A] px-4 py-3 text-center text-[#fafaf9]"
          >
            Volver a Mercado Pago
          </a>
        )}
        <div className="print:hidden flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            aria-busy={loading}
            onClick={() => setRevision((value) => value + 1)}
            className="print:hidden inline-flex items-center gap-2 border border-[#3D393A] px-4 py-2 disabled:cursor-wait disabled:opacity-60"
          >
            {loading && (
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
              />
            )}
            <span role="status" aria-live="polite">
              {loading ? 'Actualizando…' : 'Actualizar estado'}
            </span>
          </button>
          {result?.state === 'paid' && (
            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden rounded-sm bg-[#3D393A] px-4 py-3 text-sm text-[#fafaf9]"
            >
              Imprimir / guardar comprobante
            </button>
          )}
        </div>
        <Link href="/shop" className="print:hidden block underline">
          Continuar comprando
        </Link>
      </div>
    </section>
  )
}
