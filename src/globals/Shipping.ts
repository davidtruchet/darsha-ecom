import type { GlobalConfig } from 'payload'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { adminOnly } from '@/access/adminOnly'

const positiveInteger = (value: number | null | undefined) =>
  value == null || (Number.isSafeInteger(value) && value > 0) || 'Usa un entero mayor que cero.'
const money = (value: number | null | undefined) =>
  value == null || (Number.isSafeInteger(value) && value >= 0) || 'Usa un entero en centésimos.'

export const Shipping: GlobalConfig = {
  slug: 'shipping',
  label: 'Envíos',
  access: { read: () => true, update: adminOnly },
  fields: [
    { name: 'pickupAddress', type: 'text', label: 'Dirección de retiro en Darsha' },
    { name: 'pickupHours', type: 'text', label: 'Horario de retiro' },
    {
      name: 'unpaidPickupHours',
      type: 'number',
      label: 'Reserva de pedidos de retiro sin pagar (horas)',
      defaultValue: 48,
      min: 1,
      validate: positiveInteger,
    },
    {
      name: 'bankTransferInstructions',
      type: 'textarea',
      label: 'Instrucciones de transferencia bancaria',
      admin: {
        description:
          'Cuenta, banco, titular e instrucciones para identificar el pago. Se muestran solo en pedidos por transferencia.',
      },
      access: { read: adminOnlyFieldAccess },
    },
    {
      name: 'packagingWeightGrams',
      type: 'number',
      label: 'Peso del embalaje por pedido (gramos)',
      min: 1,
      validate: positiveInteger,
      admin: {
        description:
          'Configura el peso de la caja y protección. Sin este dato no se cotiza entrega nacional. Una caja por pedido; para varias cajas se requiere coordinación manual.',
      },
    },
    { name: 'sourceURL', type: 'text', label: 'Fuente del tarifario' },
    { name: 'reviewedAt', type: 'date', label: 'Fecha de revisión del tarifario' },
    {
      name: 'rates',
      type: 'array',
      label: 'Entrega a domicilio UES Xpres (impuestos incluidos)',
      fields: [
        {
          name: 'maxWeightGrams',
          type: 'number',
          required: true,
          min: 1,
          label: 'Peso máximo incluido (gramos)',
          validate: positiveInteger,
        },
        {
          name: 'montevideoPrice',
          type: 'number',
          required: true,
          min: 0,
          label: 'Montevideo (centésimos UYU)',
          validate: money,
        },
        {
          name: 'interiorPrice',
          type: 'number',
          required: true,
          min: 0,
          label: 'Interior (centésimos UYU)',
          validate: money,
        },
      ],
    },
  ],
}
