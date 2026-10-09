import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import type { Product } from '@/payload-types'
import { AddToCart } from '@/components/Cart/AddToCart'

const ecommerce = vi.hoisted(() => ({
  cart: { items: [] as { product: number; quantity: number }[] },
  isLoading: false,
  addItem: vi.fn(),
}))
const notifications = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@payloadcms/plugin-ecommerce/client/react', () => ({ useCart: () => ecommerce }))
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }))
vi.mock('sonner', () => ({ toast: notifications }))
const product = {
  id: 1,
  title: 'Crema',
  _status: 'published',
  priceInUYUEnabled: true,
  priceInUYU: 150000,
  inventory: 5,
} as Product

beforeEach(() => {
  vi.clearAllMocks()
  ecommerce.cart.items = []
  ecommerce.addItem.mockResolvedValue(undefined)
})
afterEach(cleanup)

describe('quantity selection and cart confirmation', () => {
  it('limits the selector to stock remaining after existing cart quantities', () => {
    ecommerce.cart.items = [{ product: 1, quantity: 3 }]
    render(createElement(AddToCart, { product }))
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }))
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('2')
    expect(
      (screen.getByRole('button', { name: 'Aumentar cantidad' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '99' } })
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('2')
  })
  it('passes the selected quantity and confirms success only after the cart contains it', async () => {
    ecommerce.addItem.mockImplementation(async () => {
      ecommerce.cart.items = [{ product: 1, quantity: 2 }]
    })
    render(createElement(AddToCart, { product }))
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }))
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    await waitFor(() =>
      expect(notifications.success).toHaveBeenCalledWith('2 unidades agregadas al carrito.'),
    )
    expect(ecommerce.addItem).toHaveBeenCalledWith({ product: 1, variant: undefined }, 2)
  })
  it('reports failure if the provider resolves without updating the cart', async () => {
    render(createElement(AddToCart, { product }))
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    await waitFor(() => expect(notifications.error).toHaveBeenCalledOnce())
    expect(notifications.success).not.toHaveBeenCalled()
  })
  it('disables purchasing an unpriced product', () => {
    render(createElement(AddToCart, { product: { ...product, priceInUYUEnabled: false } }))
    const button = screen.getByRole('button', { name: 'Agregar al carrito' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(ecommerce.addItem).not.toHaveBeenCalled()
  })
})
