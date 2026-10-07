import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { ShippingProvider } from '@/providers/Shipping'
import { ShippingEstimator } from '@/components/Cart/ShippingEstimator'

vi.mock('@payloadcms/plugin-ecommerce/client/react', () => ({
  useCart: () => ({ cart: { id: 1, items: [], updatedAt: 'today' } }),
}))
afterEach(cleanup)

describe('shared shipping destination', () => {
  it('preserves drawer inputs when the cart page mounts within the shared provider', () => {
    const tree = (page: string) =>
      createElement(ShippingProvider, null, createElement(ShippingEstimator, { key: page }))
    const view = render(tree('drawer'))
    fireEvent.change(screen.getByRole('combobox', { name: '¿Cómo quieres recibir tu pedido?' }), {
      target: { value: 'delivery' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Departamento' }), {
      target: { value: 'Maldonado' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Localidad' }), {
      target: { value: 'Punta del Este' },
    })
    view.rerender(tree('page'))
    expect(
      (
        screen.getByRole('combobox', {
          name: '¿Cómo quieres recibir tu pedido?',
        }) as HTMLSelectElement
      ).value,
    ).toBe('delivery')
    expect(
      (screen.getByRole('combobox', { name: 'Departamento' }) as HTMLSelectElement).value,
    ).toBe('Maldonado')
    expect((screen.getByRole('textbox', { name: 'Localidad' }) as HTMLInputElement).value).toBe(
      'Punta del Este',
    )
  })
  it('synchronizes two visible estimators and clears locality when department changes', () => {
    render(
      createElement(
        ShippingProvider,
        null,
        createElement(ShippingEstimator),
        createElement(ShippingEstimator),
      ),
    )
    fireEvent.change(
      screen.getAllByRole('combobox', { name: '¿Cómo quieres recibir tu pedido?' })[0],
      { target: { value: 'delivery' } },
    )
    fireEvent.change(screen.getAllByRole('combobox', { name: 'Departamento' })[0], {
      target: { value: 'Maldonado' },
    })
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Localidad' })[0], {
      target: { value: 'Maldonado' },
    })
    expect(
      (screen.getAllByRole('textbox', { name: 'Localidad' })[1] as HTMLInputElement).value,
    ).toBe('Maldonado')
    fireEvent.change(screen.getAllByRole('combobox', { name: 'Departamento' })[1], {
      target: { value: 'Rocha' },
    })
    expect(
      (screen.getAllByRole('textbox', { name: 'Localidad' })[0] as HTMLInputElement).value,
    ).toBe('')
  })
})
