'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useShipping } from '@/providers/Shipping'
import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  formatCheckoutPhone,
  normalizeCheckoutPhone,
  type PhoneCountry,
} from '@/utilities/checkoutPhone'
import { uruguayDepartments, type ShippingQuote } from '@/utilities/shippingQuote'
import { summarizeCart } from '@/utilities/cartSummary'
import { formatUYU } from '@/lib/currencies'
import type { CheckoutContact, CheckoutDelivery } from '@/lib/checkout/types'

export function CheckoutPage({
  pickupAddress,
  pickupHours,
}: {
  pickupAddress?: string | null
  pickupHours?: string | null
}) {
  const { cart, isLoading } = useCart()
  const { destination, setDestination } = useShipping()
  const [contact, setContact] = useState<CheckoutContact>({ name: '', email: '', phone: '' })
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>('UY')
  const [address, setAddress] = useState({ street: '', number: '', apartment: '', notes: '' })
  const [payment, setPayment] = useState('mercadopago')
  const [quote, setQuote] = useState<{ key: string; result: ShippingQuote } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const phoneInput = useRef<HTMLInputElement>(null)
  const request = useRef<{ key: string; id: string } | null>(null)
  const { subtotal, incomplete, lines } = summarizeCart(cart?.items || [])
  const key = JSON.stringify([cart?.updatedAt, cart?.items, destination])
  const shipping = quote?.key === key ? quote.result : null
  const method = destination.method === 'delivery' ? 'mercadopago' : payment
  const delivery: CheckoutDelivery = { ...destination, ...address }
  const field = 'mt-1 w-full rounded-sm border border-[#3D393A]/30 bg-[#fafaf9] p-3'
  async function post(path: string, extra: Record<string, unknown>) {
    let secret = null
    try {
      secret = localStorage.getItem('cart_secret')
    } catch {
      /* Use session cookies if available. */
    }
    const response = await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartID: cart?.id, secret, ...extra }),
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.message || 'No pudimos procesar la solicitud.')
    return body
  }
  async function estimate() {
    setBusy(true)
    setError(null)
    try {
      setQuote({ key, result: await post('/api/shipping/quote', { destination }) })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos calcular el envío.')
    } finally {
      setBusy(false)
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const phone = normalizeCheckoutPhone(contact.phone, phoneCountry)
      if (!phone) throw new Error('Ingresa un teléfono válido de Uruguay o Argentina.')
      const normalizedContact = { ...contact, phone }
      const requestKey = JSON.stringify([key, normalizedContact, delivery, method])
      if (request.current?.key !== requestKey)
        request.current = { key: requestKey, id: crypto.randomUUID() }
      const result = await post('/api/checkout/initiate', {
        contact: normalizedContact,
        delivery,
        method,
        requestID: request.current.id,
        expectedAmount: shipping?.available ? subtotal + shipping.amount : undefined,
      })
      if (!result.redirectURL) throw new Error('No recibimos la dirección de pago.')
      const target = new URL(result.redirectURL, window.location.origin)
      if (
        target.origin !== window.location.origin &&
        (!['www.mercadopago.com.uy', 'www.mercadopago.com', 'www.mercadopago.com.ar'].includes(
          target.hostname,
        ) ||
          target.protocol !== 'https:')
      )
        throw new Error('Dirección de pago inválida.')
      window.location.assign(target.href)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos iniciar la compra.')
      setBusy(false)
    }
  }
  return (
    <section className="darsha-container py-12 text-[#3D393A] md:py-20">
      <Link href="/cart" className="text-sm underline">
        Volver al carrito
      </Link>
      <h1 className="my-6 font-darsha-serif text-4xl md:text-5xl">Finalizar compra</h1>
      {!cart?.items?.length ? (
        <p>
          {isLoading ? 'Cargando tu carrito…' : 'Tu carrito está vacío.'}{' '}
          <Link href="/shop" className="underline">
            Visitar la tienda
          </Link>
        </p>
      ) : (
        <form
          onSubmit={submit}
          className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"
        >
          <div className="space-y-8 rounded-sm bg-[#E8E3DD] p-6">
            <fieldset disabled={busy} className="space-y-4">
              <legend className="mb-4 font-darsha-serif text-2xl">Tus datos</legend>
              <label className="block text-sm" htmlFor="checkout-name">
                Nombre y apellido
                <input
                  id="checkout-name"
                  name="name"
                  autoComplete="name"
                  type="text"
                  required
                  maxLength={150}
                  className={field}
                  value={contact.name}
                  onChange={(event) => setContact({ ...contact, name: event.target.value })}
                />
              </label>
              <label className="block text-sm" htmlFor="checkout-email">
                Email
                <input
                  id="checkout-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  required
                  maxLength={254}
                  className={field}
                  value={contact.email}
                  onChange={(event) => setContact({ ...contact, email: event.target.value })}
                />
              </label>
              <label className="block text-sm" htmlFor="checkout-phone-country">
                País del teléfono
                <select
                  id="checkout-phone-country"
                  name="phone-country"
                  autoComplete="off"
                  className={`${field} darsha-select`}
                  value={phoneCountry}
                  onChange={(event) => {
                    setPhoneCountry(event.target.value as PhoneCountry)
                    phoneInput.current?.setCustomValidity('')
                    setContact({ ...contact, phone: '' })
                  }}
                >
                  <option value="UY">Uruguay (+598)</option>
                  <option value="AR">Argentina (+54)</option>
                </select>
              </label>
              <label className="block text-sm" htmlFor="checkout-phone">
                Teléfono
                <input
                  id="checkout-phone"
                  ref={phoneInput}
                  name="phone"
                  autoComplete="tel"
                  type="tel"
                  required
                  maxLength={30}
                  className={field}
                  value={contact.phone}
                  aria-describedby="checkout-phone-help"
                  placeholder={phoneCountry === 'UY' ? '099 123 456' : '+54 9 11 2345 6789'}
                  onChange={(event) => {
                    const value = event.target.value
                    if (value.startsWith('+54')) setPhoneCountry('AR')
                    else if (value.startsWith('+598')) setPhoneCountry('UY')
                    event.target.setCustomValidity('')
                    const formatted = formatCheckoutPhone(value, phoneCountry)
                    // Let Backspace remove separators instead of immediately inserting them again.
                    setContact({
                      ...contact,
                      phone:
                        value.length < contact.phone.length && formatted === contact.phone
                          ? value
                          : formatted,
                    })
                  }}
                  onBlur={(event) => {
                    event.target.setCustomValidity(
                      contact.phone && !normalizeCheckoutPhone(contact.phone, phoneCountry)
                        ? 'Ingresa un teléfono válido de Uruguay o Argentina.'
                        : '',
                    )
                  }}
                />
              </label>
              <p id="checkout-phone-help" className="text-xs">
                Aceptamos celulares y teléfonos fijos. Puedes pegar el número con +598 o +54.
              </p>
            </fieldset>
            <fieldset disabled={busy} className="space-y-4">
              <legend className="mb-4 font-darsha-serif text-2xl">Entrega o retiro</legend>
              <label className="block text-sm" htmlFor="checkout-delivery-method">
                Método de entrega
                <select
                  id="checkout-delivery-method"
                  name="delivery-method"
                  autoComplete="off"
                  className={`${field} darsha-select`}
                  value={destination.method}
                  onChange={(event) =>
                    setDestination({
                      ...destination,
                      method: event.target.value as 'pickup' | 'delivery',
                    })
                  }
                >
                  <option value="pickup">Retiro gratis en Darsha</option>
                  <option value="delivery">Entrega a domicilio</option>
                </select>
              </label>
              {destination.method === 'pickup' ? (
                <div className="space-y-2 text-sm">
                  <p>Te avisaremos cuando esté pronto para retirar.</p>
                  {pickupAddress && <p>{pickupAddress}</p>}
                  {pickupHours && <p>{pickupHours}</p>}
                </div>
              ) : (
                <>
                  <label className="block text-sm" htmlFor="checkout-department">
                    Departamento
                    <select
                      id="checkout-department"
                      name="department"
                      autoComplete="shipping address-level1"
                      required
                      className={`${field} darsha-select`}
                      value={destination.department}
                      onChange={(event) =>
                        setDestination({
                          ...destination,
                          department: event.target.value,
                          locality: '',
                        })
                      }
                    >
                      <option value="">Seleccionar departamento</option>
                      {uruguayDepartments.map((name) => (
                        <option key={name}>{name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm" htmlFor="checkout-locality">
                    Localidad
                    <input
                      id="checkout-locality"
                      name="locality"
                      autoComplete="shipping address-level2"
                      type="text"
                      required
                      maxLength={150}
                      className={field}
                      value={destination.locality}
                      onChange={(event) =>
                        setDestination({ ...destination, locality: event.target.value })
                      }
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm" htmlFor="checkout-street">
                      Calle
                      <input
                        id="checkout-street"
                        name="street"
                        autoComplete="shipping address-line1"
                        type="text"
                        required
                        maxLength={150}
                        className={field}
                        value={address.street}
                        onChange={(event) => setAddress({ ...address, street: event.target.value })}
                      />
                    </label>
                    <label className="block text-sm" htmlFor="checkout-street-number">
                      Número de puerta
                      <input
                        id="checkout-street-number"
                        name="street-number"
                        autoComplete="off"
                        type="text"
                        inputMode="text"
                        required
                        maxLength={30}
                        className={field}
                        value={address.number}
                        onChange={(event) => setAddress({ ...address, number: event.target.value })}
                      />
                    </label>
                  </div>
                  <label className="block text-sm" htmlFor="checkout-apartment">
                    Apartamento (opcional)
                    <input
                      id="checkout-apartment"
                      name="apartment"
                      autoComplete="shipping address-line2"
                      type="text"
                      maxLength={30}
                      className={field}
                      value={address.apartment}
                      onChange={(event) =>
                        setAddress({ ...address, apartment: event.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm" htmlFor="checkout-delivery-notes">
                    Referencias para la entrega (opcional)
                    <textarea
                      id="checkout-delivery-notes"
                      name="delivery-notes"
                      autoComplete="off"
                      maxLength={500}
                      className={field}
                      value={address.notes}
                      onChange={(event) => setAddress({ ...address, notes: event.target.value })}
                    />
                  </label>
                  <p className="text-sm">
                    Entrega gratis en Punta del Este y Maldonado. En otras localidades enviamos por
                    UES Xpres.
                  </p>
                </>
              )}
              <button
                type="button"
                disabled={
                  busy ||
                  (destination.method === 'delivery' &&
                    (!destination.department || !destination.locality.trim()))
                }
                onClick={estimate}
                className="border border-[#3D393A] px-4 py-2 text-sm disabled:opacity-40"
              >
                {busy ? 'Calculando…' : 'Confirmar costo de envío'}
              </button>
            </fieldset>
            <fieldset disabled={busy} className="space-y-3">
              <legend className="mb-4 font-darsha-serif text-2xl">Forma de pago</legend>
              <label className="flex gap-2 text-sm" htmlFor="checkout-payment-mercadopago">
                <input
                  type="radio"
                  name="payment"
                  value="mercadopago"
                  id="checkout-payment-mercadopago"
                  checked={method === 'mercadopago'}
                  onChange={() => setPayment('mercadopago')}
                />
                Mercado Pago
              </label>
              {destination.method === 'pickup' && (
                <>
                  <label className="flex gap-2 text-sm" htmlFor="checkout-payment-bank-transfer">
                    <input
                      type="radio"
                      name="payment"
                      value="bank-transfer"
                      id="checkout-payment-bank-transfer"
                      checked={method === 'bank-transfer'}
                      onChange={() => setPayment('bank-transfer')}
                    />
                    Transferencia bancaria antes del retiro
                  </label>
                  <label className="flex gap-2 text-sm" htmlFor="checkout-payment-cash">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      id="checkout-payment-cash"
                      checked={method === 'cash'}
                      onChange={() => setPayment('cash')}
                    />
                    Efectivo al retirar
                  </label>
                </>
              )}
              <p className="text-sm text-[#4b5563]">
                {method === 'mercadopago'
                  ? 'Te llevaremos a Mercado Pago para completar el pago de forma segura.'
                  : 'Tu pedido quedará pendiente de pago hasta que Darsha confirme la recepción.'}
              </p>
            </fieldset>
          </div>
          <aside className="h-fit space-y-5 rounded-sm bg-[#E8E3DD] p-6 lg:sticky lg:top-32">
            <h2 className="font-darsha-serif text-2xl">Tu pedido</h2>
            <ul className="space-y-4">
              {(cart.items || []).map((item, index) => (
                <li key={item.id || index} className="text-sm">
                  <p>
                    {lines[index].product?.title || 'Producto no disponible'} × {item.quantity}
                  </p>
                  <p className="mt-1 text-right">
                    {lines[index].total !== null
                      ? formatUYU(lines[index].total!)
                      : 'Precio por confirmar'}
                  </p>
                  {lines[index].warning && <p className="text-red-900">{lines[index].warning}</p>}
                </li>
              ))}
            </ul>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatUYU(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Envío</span>
              <span>
                {shipping?.available
                  ? shipping.amount
                    ? formatUYU(shipping.amount)
                    : 'Gratis'
                  : 'Por confirmar'}
              </span>
            </div>
            {shipping && !shipping.available && (
              <p className="text-sm text-red-900">{shipping.message}</p>
            )}
            {shipping?.available && (
              <div className="flex justify-between border-t border-[#D1C7C0] pt-4 text-lg">
                <span>Total UYU</span>
                <strong>{formatUYU(subtotal + shipping.amount)}</strong>
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-900">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={
                busy ||
                isLoading ||
                incomplete ||
                !shipping?.available ||
                lines.some((line) => !!line.warning)
              }
              className="w-full rounded-sm bg-[#3D393A] px-5 py-3 text-[#fafaf9] disabled:opacity-40"
            >
              {busy
                ? 'Procesando…'
                : method === 'mercadopago'
                  ? 'Continuar a Mercado Pago'
                  : 'Confirmar pedido'}
            </button>
            <p className="text-xs text-[#4b5563]">
              El precio, el stock y el envío se verifican antes de confirmar.
            </p>
          </aside>
        </form>
      )}
    </section>
  )
}
