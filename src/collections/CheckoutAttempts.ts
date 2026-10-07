import type { CollectionConfig, Field } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { confirmManualPayment } from '@/lib/checkout/settlement'

export const CheckoutAttempts: CollectionConfig = {
  slug: 'checkout-attempts',
  labels: { singular: 'Pago de pedido', plural: 'Pagos de pedidos' },
  access: { create: () => false, read: adminOnly, update: adminOnly, delete: () => false },
  admin: {
    group: 'Ecommerce',
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'method', 'state', 'amount', 'expiresAt'],
  },
  fields: (
    [
      { name: 'reference', type: 'text', required: true, unique: true, admin: { readOnly: true } },
      {
        name: 'cart',
        type: 'relationship',
        relationTo: 'carts',
        required: true,
        admin: { readOnly: true },
      },
      { name: 'customer', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
      {
        name: 'transaction',
        type: 'relationship',
        relationTo: 'transactions',
        admin: { readOnly: true },
      },
      { name: 'order', type: 'relationship', relationTo: 'orders', admin: { readOnly: true } },
      {
        name: 'method',
        type: 'select',
        options: ['mercadopago', 'bank-transfer', 'cash'],
        required: true,
        admin: { readOnly: true },
      },
      {
        name: 'state',
        type: 'select',
        options: ['initializing', 'pending', 'paid', 'expired', 'cancelled', 'review'],
        required: true,
        admin: { readOnly: true },
      },
      {
        name: 'reservation',
        type: 'select',
        options: ['held', 'consumed', 'released'],
        required: true,
        admin: { readOnly: true },
      },
      {
        name: 'amount',
        type: 'number',
        required: true,
        admin: { readOnly: true, description: 'Total en centésimos UYU.' },
      },
      { name: 'snapshot', type: 'json', required: true, admin: { readOnly: true } },
      { name: 'fingerprint', type: 'text', required: true, admin: { hidden: true } },
      {
        name: 'accessHash',
        type: 'text',
        required: true,
        admin: { hidden: true },
        access: { read: () => false },
      },
      { name: 'preferenceID', type: 'text', admin: { readOnly: true } },
      { name: 'checkoutURL', type: 'text', admin: { hidden: true } },
      { name: 'paymentID', type: 'text', unique: true, admin: { readOnly: true } },
      { name: 'expiresAt', type: 'date', required: true, admin: { readOnly: true } },
      {
        name: 'manualPaymentReceived',
        type: 'checkbox',
        label: 'Pago recibido (transferencia o efectivo)',
        admin: {
          description:
            'Marca solo después de verificar el pago. No prepara ni entrega el pedido automáticamente.',
        },
      },
    ] as Field[]
  ).map((field) =>
    'name' in field && field.name === 'manualPaymentReceived'
      ? field
      : ({
          ...field,
          access: { ...('access' in field ? field.access : {}), update: () => false },
        } as Field),
  ),
  hooks: {
    beforeChange: [
      ({ data, req, originalDoc }) => {
        if (req.context.checkoutInternal) return data
        if (
          data.manualPaymentReceived &&
          !originalDoc?.manualPaymentReceived &&
          (originalDoc?.method === 'mercadopago' || originalDoc?.reservation !== 'held')
        )
          throw new Error('Este pago no admite confirmación manual.')
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        if (
          !req.context.checkoutInternal &&
          doc.manualPaymentReceived &&
          !previousDoc?.manualPaymentReceived
        )
          await confirmManualPayment(req, doc.id)
        return doc
      },
    ],
  },
}
