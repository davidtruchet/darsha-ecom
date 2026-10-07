import { describe, expect, it } from 'vitest'
import { formatCheckoutPhone, normalizeCheckoutPhone } from '@/utilities/checkoutPhone'
import { validateCheckoutInput } from '@/lib/checkout/validation'

describe('Uruguay and Argentina checkout phones', () => {
  it('formats partial input and normalizes local and international numbers', () => {
    expect(formatCheckoutPhone('099123456')).toBe('099 123 456')
    expect(formatCheckoutPhone('+5491123456789', 'AR')).toBe('+54 9 11 2345 6789')
    expect(formatCheckoutPhone('09')).toBe('09')
    expect(normalizeCheckoutPhone('099 123 456')).toBe('+59899123456')
    expect(normalizeCheckoutPhone('+598 99 123 456')).toBe('+59899123456')
    expect(normalizeCheckoutPhone('011 15 2345 6789', 'AR')).toBe('+5491123456789')
    expect(normalizeCheckoutPhone('+54 9 11 2345 6789')).toBe('+5491123456789')
    expect(normalizeCheckoutPhone('2900 1234')).toBe('+59829001234')
    expect(normalizeCheckoutPhone('+54 11 2345 6789')).toBe('+541123456789')
  })
  it('rejects incomplete, invalid and unsupported-country numbers on the server', () => {
    const delivery = {
      method: 'pickup' as const,
      department: '',
      locality: '',
      street: '',
      number: '',
      apartment: '',
      notes: '',
    }
    for (const phone of [
      '099',
      '123456789',
      '+1 202 555 0123',
      '+598 99 123 4567',
      'abc099123456',
    ]) {
      expect(normalizeCheckoutPhone(phone)).toBeNull()
      expect(() =>
        validateCheckoutInput(
          { name: 'Cliente', email: 'cliente@example.com', phone },
          delivery,
          'cash',
        ),
      ).toThrow()
    }
  })
})
