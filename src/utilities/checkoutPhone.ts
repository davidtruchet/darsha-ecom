import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js/max'

export type PhoneCountry = 'UY' | 'AR'

/** Keep partial input editable; international prefixes take priority over the selector. */
export function formatCheckoutPhone(value: string, country: PhoneCountry = 'UY') {
  const sanitized = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
  return new AsYouType(country).input(sanitized)
}

/** Validate numbering plans and return E.164 for storage. This does not prove ownership. */
export function normalizeCheckoutPhone(value: string, country: PhoneCountry = 'UY') {
  if (!/^[+\d\s()-]+$/.test(value)) return null
  const phone = parsePhoneNumberFromString(value, country)
  if (!phone || !['UY', 'AR'].includes(phone.country || '') || !phone.isValid()) return null
  return phone.number
}
