import { describe, expect, it } from 'vitest'
import type { Product, Variant } from '@/payload-types'
import { getProductPurchaseState } from '@/utilities/productPurchase'

const product = (overrides: Partial<Product> = {}) =>
  ({
    id: 1,
    title: 'Crema',
    _status: 'published',
    priceInUYUEnabled: true,
    priceInUYU: 150000,
    inventory: 5,
    ...overrides,
  }) as Product
const variant = (overrides: Partial<Variant> = {}) =>
  ({
    id: 10,
    priceInUYUEnabled: true,
    priceInUYU: 100000,
    inventory: 3,
    ...overrides,
  }) as Variant

describe('product purchase availability', () => {
  it('does not treat missing prices as free products', () => {
    const state = getProductPurchaseState(product({ priceInUYU: null }))
    expect(state.price).toBeNull()
    expect(state.reason).toBe('Precio por confirmar.')
  })
  it('ignores a disabled stale price', () => {
    expect(getProductPurchaseState(product({ priceInUYUEnabled: false })).price).toBeNull()
  })
  it('distinguishes a confirmed zero price from an unknown price', () => {
    const state = getProductPurchaseState(product({ priceInUYU: 0 }))
    expect(state.price).toBe(0)
    expect(state.reason).toBeNull()
  })
  it('blocks missing stock and draft products', () => {
    expect(getProductPurchaseState(product({ inventory: null })).reason).toBe(
      'Sin stock por el momento.',
    )
    expect(getProductPurchaseState(product({ _status: 'draft' })).reason).toContain('vista previa')
  })
  it('subtracts quantities already in the cart and never exceeds inventory', () => {
    const state = getProductPurchaseState(product(), null, [
      { product: { id: 1 }, quantity: 2 },
      { product: 1, quantity: 2 },
      { product: 2, quantity: 8 },
    ])
    expect(state.remaining).toBe(1)
    expect(state.reason).toBeNull()
    const full = getProductPurchaseState(product(), null, [{ product: 1, quantity: 5 }])
    expect(full.remaining).toBe(0)
    expect(full.reason).toContain('todas las unidades')
  })
  it('requires a valid variant rather than falling back to the product price', () => {
    const item = product({ enableVariants: true, variants: { docs: [variant()] } })
    expect(getProductPurchaseState(item).reason).toContain('Selecciona')
    expect(getProductPurchaseState(item, '999').reason).toContain('Selecciona')
    const selected = getProductPurchaseState(item, '10')
    expect(selected.price).toBe(100000)
    expect(selected.inventory).toBe(3)
  })
  it('limits each selected variant independently of other variants in the cart', () => {
    const item = product({
      enableVariants: true,
      variants: { docs: [variant(), variant({ id: 11 })] },
    })
    const state = getProductPurchaseState(item, '10', [
      { product: 1, variant: { id: 10 }, quantity: 2 },
      { product: 1, variant: 11, quantity: 3 },
    ])
    expect(state.remaining).toBe(1)
  })
  it('blocks an unpriced variant even when the parent product has a price', () => {
    const item = product({
      enableVariants: true,
      variants: { docs: [variant({ priceInUYUEnabled: false })] },
    })
    expect(getProductPurchaseState(item, '10').reason).toBe('Precio por confirmar.')
  })
})
