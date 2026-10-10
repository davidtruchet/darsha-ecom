import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
export const OrderEmails: CollectionConfig = {
  slug: 'order-emails',
  labels: { singular: 'Correo de pedido', plural: 'Correos enviados' },
  admin: {
    group: 'Ecommerce',
    useAsTitle: 'subject',
    defaultColumns: ['order', 'event', 'recipient', 'state', 'sentAt'],
  },
  access: { read: adminOnly, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true },
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true },
    { name: 'event', type: 'text', required: true },
    { name: 'recipient', type: 'email', required: true },
    { name: 'replyTo', type: 'email', required: true },
    { name: 'subject', type: 'text', required: true },
    { name: 'html', type: 'textarea', required: true, admin: { hidden: true } },
    { name: 'text', type: 'textarea', required: true, admin: { hidden: true } },
    {
      name: 'state',
      type: 'select',
      options: ['pending', 'sending', 'sent', 'failed', 'review', 'skipped'],
      defaultValue: 'pending',
      required: true,
    },
    { name: 'attempts', type: 'number', defaultValue: 0, required: true },
    { name: 'nextAttemptAt', type: 'date', required: true },
    { name: 'firstAttemptAt', type: 'date' },
    { name: 'leaseUntil', type: 'date' },
    { name: 'leaseToken', type: 'text', admin: { hidden: true } },
    { name: 'sentAt', type: 'date' },
    { name: 'messageID', type: 'text' },
    { name: 'lastError', type: 'text' },
  ],
}
