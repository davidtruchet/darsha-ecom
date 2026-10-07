import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { CheckoutResult } from '@/components/checkout/CheckoutResult'
const state = vi.hoisted(() => ({ synchronize: vi.fn() }))
vi.mock('@/providers/CartSession', () => ({ useSynchronizePaidCart: () => state.synchronize }))
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('reference=test-reference'),
}))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  state.synchronize.mockClear()
})
describe('paid checkout receipt', () => {
  it('synchronizes the cart only after verified payment and offers a printable receipt', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            reference: 'test-reference',
            state: 'paid',
            method: 'mercadopago',
            amount: 96500,
            orderID: 7,
            createdAt: '2026-10-06T20:00:00Z',
            snapshot: {
              contact: { name: 'Cliente', email: 'cliente@example.com' },
              delivery: { method: 'pickup' },
              shipping: 0,
              lines: [{ product: 1, title: 'Crema', quantity: 1, unitPrice: 96500 }],
            },
          }),
        }),
    )
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    render(createElement(CheckoutResult))
    await waitFor(() => expect(screen.getByText('Pago confirmado')).toBeTruthy())
    expect(state.synchronize).toHaveBeenCalledWith('test-reference')
    expect(screen.getByText('Pedido #7')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir / guardar comprobante' }))
    expect(print).toHaveBeenCalledOnce()
  })
  it('does not clear the cart or offer a paid receipt for a pending payment', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            reference: 'test-reference',
            state: 'pending',
            method: 'mercadopago',
            amount: 96500,
            createdAt: '2026-10-06T20:00:00Z',
            expiresAt: '2026-10-06T21:00:00Z',
            snapshot: {
              contact: { name: 'Cliente', email: 'cliente@example.com' },
              delivery: { method: 'pickup' },
              shipping: 0,
              lines: [],
            },
          }),
        }),
    )
    render(createElement(CheckoutResult))
    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Actualizar estado' }) as HTMLButtonElement).disabled,
      ).toBe(false),
    )
    expect(state.synchronize).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Imprimir / guardar comprobante' })).toBeNull()
  })
})
