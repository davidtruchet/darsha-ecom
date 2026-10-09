export type CheckoutContact = { name: string; email: string; phone: string }
export type CheckoutDelivery = {
  method: 'pickup' | 'delivery'
  department: string
  locality: string
  street: string
  number: string
  apartment: string
  notes: string
}
export type CheckoutLine = {
  cartItemID?: string
  product: number
  variant?: number
  quantity: number
  title: string
  unitPrice: number
}
export type CheckoutSnapshot = {
  contact: CheckoutContact
  delivery: CheckoutDelivery
  lines: CheckoutLine[]
  subtotal: number
  shipping: number
  shippingService: string
  currency: 'UYU'
}
