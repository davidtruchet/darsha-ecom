import { describe, expect, it } from 'vitest'
import { calculateShippingQuote } from '@/utilities/shippingQuote'

const settings = {
  packagingWeightGrams: 100,
  rates: [
    { maxWeightGrams: 2000, montevideoPrice: 28500, interiorPrice: 31100 },
    { maxWeightGrams: 5000, montevideoPrice: 33100, interiorPrice: 34600 },
  ],
}
const items = [{ product: { shippingWeightGrams: 500 }, quantity: 2 }]
const destination = { method: 'delivery' as const, department: 'Montevideo', locality: 'Centro' }

describe('Uruguay shipping quotes', () => {
  it('uses integer grams, packaging and quantities to choose a UYU price', () => {
    expect(calculateShippingQuote(destination, items, settings)).toEqual({
      available: true,
      amount: 28500,
      currency: 'UYU',
      service: 'ues-xpres-home',
      weightGrams: 1100,
      maxWeightGrams: 2000,
    })
  })
  it('includes the exact band limit and advances one gram above it', () => {
    const order = [{ product: { shippingWeightGrams: 1900 }, quantity: 1 }]
    expect(calculateShippingQuote(destination, order, settings)).toMatchObject({ amount: 28500 })
    expect(
      calculateShippingQuote(
        destination,
        [{ product: { shippingWeightGrams: 1901 }, quantity: 1 }],
        settings,
      ),
    ).toMatchObject({ amount: 33100 })
  })
  it('uses Interior prices for destinations outside Montevideo', () => {
    expect(
      calculateShippingQuote(
        { ...destination, department: 'Rocha', locality: 'Rocha' },
        items,
        settings,
      ),
    ).toMatchObject({ amount: 31100 })
  })
  it.each(['Punta del Este', '  MALDONADO  '])(
    'keeps %s local delivery free without weights',
    (locality) => {
      expect(
        calculateShippingQuote(
          { method: 'delivery', department: 'Maldonado', locality },
          [{ product: {}, quantity: 1 }],
          {},
        ),
      ).toMatchObject({ amount: 0, service: 'darsha-local' })
    },
  )
  it('does not make all of the Maldonado department free', () => {
    expect(
      calculateShippingQuote(
        { ...destination, department: 'Maldonado', locality: 'Piriápolis' },
        items,
        settings,
      ),
    ).toMatchObject({ amount: 31100 })
    expect(
      calculateShippingQuote(
        { ...destination, department: 'Rocha', locality: 'Maldonado' },
        items,
        settings,
      ),
    ).toMatchObject({ amount: 31100 })
  })
  it('keeps store pickup free without shipping weights', () => {
    expect(
      calculateShippingQuote({ method: 'pickup' }, [{ product: {}, quantity: 1 }], {}),
    ).toMatchObject({ amount: 0, service: 'darsha-pickup' })
  })
  it('refuses paid delivery with missing or fractional product weights or packaging weight', () => {
    expect(
      calculateShippingQuote(destination, [{ product: {}, quantity: 1 }], settings).available,
    ).toBe(false)
    expect(
      calculateShippingQuote(
        destination,
        [{ product: { shippingWeightGrams: 0.5 }, quantity: 1 }],
        settings,
      ).available,
    ).toBe(false)
    expect(
      calculateShippingQuote(destination, items, { ...settings, packagingWeightGrams: null })
        .available,
    ).toBe(false)
  })
  it('refuses quantities, destinations or tariff configuration that cannot be trusted', () => {
    expect(
      calculateShippingQuote(
        destination,
        [{ product: { shippingWeightGrams: 500 }, quantity: -1 }],
        settings,
      ).available,
    ).toBe(false)
    expect(
      calculateShippingQuote({ ...destination, department: 'Invalid' }, items, settings).available,
    ).toBe(false)
    expect(
      calculateShippingQuote(destination, items, {
        ...settings,
        rates: [settings.rates[0], settings.rates[0]],
      }).available,
    ).toBe(false)
    expect(
      calculateShippingQuote(destination, items, {
        ...settings,
        rates: [{ ...settings.rates[0], montevideoPrice: -1 }],
      }).available,
    ).toBe(false)
  })
  it('does not guess a price for empty or oversized orders', () => {
    expect(calculateShippingQuote({ method: 'pickup' }, [], settings).available).toBe(false)
    expect(
      calculateShippingQuote(
        destination,
        [{ product: { shippingWeightGrams: 5000 }, quantity: 1 }],
        settings,
      ).available,
    ).toBe(false)
  })
})
