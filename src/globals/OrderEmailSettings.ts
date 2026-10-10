import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
export const OrderEmailSettings: GlobalConfig = {
  slug: 'order-email-settings',
  label: 'Correos de pedidos',
  access: { read: adminOnly, update: adminOnly },
  fields: [
    { name: 'enabled', type: 'checkbox', label: 'Enviar notificaciones', defaultValue: true },
    {
      name: 'sellerEmail',
      type: 'email',
      label: 'Correo de Darsha para pedidos',
      required: true,
      defaultValue: 'davidmt04@gmail.com',
    },
    {
      name: 'replyTo',
      type: 'email',
      label: 'Responder a',
      required: true,
      defaultValue: 'pedidos@espaciodarsha.com',
    },
  ],
}
