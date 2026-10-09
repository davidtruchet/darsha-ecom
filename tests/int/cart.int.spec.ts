import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render as testingRender,
  screen,
  waitFor,
} from '@testing-library/react'
import { createElement, type ReactElement } from 'react'
import { ShippingProvider } from '@/providers/Shipping'
const render = (ui: ReactElement) => testingRender(ui, { wrapper: ShippingProvider })
import type { Cart, Product } from '@/payload-types'
import { CartContents } from '@/components/Cart/CartContents'
import { summarizeCart } from '@/utilities/cartSummary'

const state = vi.hoisted(() => ({
  cart: { items: [] } as unknown as Cart,
  isLoading: false,
  incrementItem: vi.fn(),
  decrementItem: vi.fn(),
  removeItem: vi.fn(),
  refreshCart: vi.fn(),
}))
vi.mock('@payloadcms/plugin-ecommerce/client/react', () => ({ useCart: () => state }))
const product = {
  id: 1,
  title: 'Crema',
  slug: 'crema',
  _status: 'published',
  inventory: 2,
  priceInUYUEnabled: true,
  priceInUYU: 150000,
} as Product
beforeEach(() => {
  vi.clearAllMocks()
  state.cart = { items: [{ id: 'line', product, quantity: 1 }] } as Cart
})
afterEach(cleanup)

describe('cart review and actions', () => {
  it('calculates line totals in cents and marks unknown prices as incomplete', () => {
    const summary = summarizeCart([
      { product, quantity: 2 },
      { product: { ...product, priceInUYUEnabled: false }, quantity: 1 },
    ])
    expect(summary.subtotal).toBe(300000)
    expect(summary.incomplete).toBe(true)
    expect(summary.lines[1].total).toBeNull()
  })
  it('detects stock reduction and unresolved products or variants', () => {
    expect(summarizeCart([{ product, quantity: 3 }]).lines[0].warning).toContain('2 unidades')
    expect(summarizeCart([{ product: 123, quantity: 1 }]).incomplete).toBe(true)
    expect(summarizeCart([{ product, variant: 123, quantity: 1 }]).incomplete).toBe(true)
  })
  it('shows the empty state and a shopping link without checkout', () => {
    state.cart.items = []
    render(createElement(CartContents))
    expect(screen.getByText('Tu carrito está vacío')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Continuar comprando' }).getAttribute('href')).toBe(
      '/shop',
    )
    expect(document.querySelector('a[href="/checkout"]')).toBeNull()
  })
  it('increments a line and prevents increasing beyond stock', async () => {
    state.incrementItem.mockImplementation(async () => {
      state.cart.items = [{ id: 'line', product, quantity: 2 }]
    })
    render(createElement(CartContents))
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Crema' }))
    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Aumentar cantidad de Crema' }) as HTMLButtonElement)
          .disabled,
      ).toBe(true),
    )
    expect(state.incrementItem).toHaveBeenCalledWith('line')
  })
  it('clears successful confirmation before another cart view changes the quantity', async () => {
    state.incrementItem.mockImplementation(async () => {
      state.cart.items = [{ id: 'line', product, quantity: 2 }]
    })
    const view = render(createElement(CartContents))
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Crema' }))
    await waitFor(() => expect(screen.getByText('2')).toBeTruthy())
    await new Promise((resolve) => setTimeout(resolve, 20))
    state.cart.items = [{ id: 'line', product, quantity: 1 }]
    view.rerender(createElement(CartContents))
    await new Promise((resolve) => setTimeout(resolve, 1600))
    expect(screen.queryByRole('alert')).toBeNull()
  })
  it('does not call the provider refresh method that omits guest cart authentication', () => {
    state.cart.id = 1
    render(createElement(CartContents))
    expect(state.refreshCart).not.toHaveBeenCalled()
  })
  it('removes an item and renders the empty state', async () => {
    state.removeItem.mockImplementation(async () => {
      state.cart.items = []
    })
    render(createElement(CartContents))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Crema' }))
    await waitFor(() => expect(screen.getByText('Tu carrito está vacío')).toBeTruthy())
  })
  it('reports a silent provider failure without pretending an update succeeded', async () => {
    state.incrementItem.mockResolvedValue(undefined)
    render(createElement(CartContents))
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Crema' }))
    await waitFor(
      () => expect(screen.getByRole('alert').textContent).toContain('No pudimos actualizar'),
      { timeout: 3000 },
    )
  })
})
