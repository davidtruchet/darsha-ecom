import type { Block } from 'payload'

export const DarshaShopIntro: Block = {
  slug: 'darshaShopIntro',
  labels: { singular: 'Introducción de tienda', plural: 'Introducciones de tienda' },
  fields: [
    { name: 'heading', type: 'text', required: true, label: 'Título' },
    { name: 'intro', type: 'textarea', required: true, label: 'Introducción' },
  ],
}

export const DarshaShopPromotion: Block = {
  slug: 'darshaShopPromotion',
  labels: { singular: 'Banner promocional', plural: 'Banners promocionales' },
  fields: [
    { name: 'heading', type: 'text', required: true, label: 'Título' },
    { name: 'description', type: 'textarea', label: 'Descripción' },
    { name: 'linkLabel', type: 'text', label: 'Texto del enlace' },
    { name: 'linkURL', type: 'text', label: 'Enlace' },
  ],
}

export const DarshaProductCatalog: Block = {
  slug: 'darshaProductCatalog',
  labels: { singular: 'Catálogo de productos', plural: 'Catálogos de productos' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Nuestros productos',
      label: 'Título',
    },
    {
      name: 'pageSize',
      type: 'number',
      required: true,
      min: 1,
      max: 48,
      defaultValue: 12,
      label: 'Productos por página',
      validate: (value: number | null | undefined) =>
        value != null && Number.isInteger(value) ? true : 'Usa un número entero.',
    },
    {
      name: 'emptyMessage',
      type: 'text',
      required: true,
      defaultValue: 'Pronto encontrarás aquí nuestros productos para el cuidado de tu piel.',
      label: 'Mensaje sin productos',
    },
  ],
}
