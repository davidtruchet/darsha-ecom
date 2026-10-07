import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { ShippingProvider } from '@/providers/Shipping'
import { CheckoutPage } from '@/components/checkout/CheckoutPage'

vi.mock('@payloadcms/plugin-ecommerce/client/react', () => ({
  useCart: () => ({
    cart: {
      id: 1,
      items: [
        {
          id: 'line',
          quantity: 1,
          product: {
            id: 1,
            title: 'Crema',
            inventory: 10,
            priceInUYUEnabled: true,
            priceInUYU: 96500,
          },
        },
      ],
    },
    isLoading: false,
  }),
}))
afterEach(cleanup)

describe('checkout field semantics and phone input', () => {
  it('provides identifiers, names, label associations and autocomplete for delivery', () => {
    render(createElement(ShippingProvider, null, createElement(CheckoutPage)))
    fireEvent.change(screen.getByLabelText('Método de entrega'), { target: { value: 'delivery' } })
    const controls = document.querySelectorAll<HTMLInputElement>('input, select, textarea')
    const ids = [...controls].map((control) => control.id)
    expect(new Set(ids).size).toBe(controls.length)
    for (const control of controls) {
      expect(control.id).toBeTruthy()
      expect(control.name).toBeTruthy()
      expect(document.querySelector(`label[for="${control.id}"]`)).toBeTruthy()
    }
    expect(screen.getByLabelText('Email').getAttribute('type')).toBe('email')
    expect(screen.getByLabelText('Teléfono').getAttribute('autocomplete')).toBe('tel')
    expect(screen.getByLabelText('Departamento').getAttribute('autocomplete')).toBe(
      'shipping address-level1',
    )
    expect(screen.getByLabelText('Localidad').getAttribute('autocomplete')).toBe(
      'shipping address-level2',
    )
  })
  it('masks both countries, permits deleting separators, and reports invalid numbers', () => {
    render(createElement(ShippingProvider, null, createElement(CheckoutPage)))
    const input = screen.getByLabelText('Teléfono') as HTMLInputElement
    fireEvent.change(input, { target: { value: '099123456' } })
    expect(input.value).toBe('099 123 456')
    fireEvent.change(input, { target: { value: '099 123456' } })
    expect(input.value).toBe('099 123456')
    fireEvent.change(input, { target: { value: '+5491123456789' } })
    expect(input.value).toBe('+54 9 11 2345 6789')
    expect((screen.getByLabelText('País del teléfono') as HTMLSelectElement).value).toBe('AR')
    fireEvent.blur(input)
    expect(input.validity.valid).toBe(true)
    fireEvent.change(input, { target: { value: '123' } })
    fireEvent.blur(input)
    expect(input.validity.customError).toBe(true)
    fireEvent.change(screen.getByLabelText('País del teléfono'), { target: { value: 'UY' } })
    expect(input.value).toBe('')
    expect(input.validity.customError).toBe(false)
  })
})
