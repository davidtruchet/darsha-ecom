import type { Block } from 'payload'

const heading = { name: 'heading', type: 'text', label: 'Título', required: true } as const
const intro = { name: 'intro', type: 'textarea', label: 'Introducción' } as const
const image = (name = 'image') => ({
  name,
  type: 'upload' as const,
  relationTo: 'media' as const,
  required: true,
  label: 'Imagen',
})
const linkFields = [
  { name: 'label', type: 'text' as const, label: 'Texto del enlace', required: true },
  { name: 'url', type: 'text' as const, label: 'Destino', required: true },
]

export const DarshaHero: Block = {
  slug: 'darshaHero',
  labels: { singular: 'Portada', plural: 'Portadas' },
  fields: [heading, intro, image(), ...linkFields],
}

export const DarshaCards: Block = {
  slug: 'darshaCards',
  labels: { singular: 'Tarjetas de enlaces', plural: 'Tarjetas de enlaces' },
  fields: [
    heading,
    intro,
    {
      name: 'cards',
      type: 'array',
      label: 'Tarjetas',
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', label: 'Título', required: true },
        image(),
        { name: 'url', type: 'text', label: 'Destino', required: true },
        { name: 'badge', type: 'text', label: 'Etiqueta opcional' },
      ],
    },
  ],
}

export const DarshaImageText: Block = {
  slug: 'darshaImageText',
  labels: { singular: 'Texto con imagen', plural: 'Texto con imagen' },
  fields: [
    heading,
    {
      name: 'paragraphs',
      type: 'array',
      label: 'Párrafos',
      minRows: 1,
      fields: [{ name: 'text', type: 'textarea', label: 'Texto', required: true }],
    },
    image(),
  ],
}

export const DarshaTestimonials: Block = {
  slug: 'darshaTestimonials',
  labels: { singular: 'Testimonios', plural: 'Testimonios' },
  fields: [
    heading,
    {
      name: 'reviews',
      type: 'array',
      label: 'Reseñas',
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', label: 'Título', required: true },
        { name: 'author', type: 'text', label: 'Nombre', required: true },
        { name: 'quote', type: 'textarea', label: 'Reseña', required: true },
      ],
    },
  ],
}

export const DarshaContact: Block = {
  slug: 'darshaContact',
  labels: { singular: 'Contacto', plural: 'Contacto' },
  fields: [
    heading,
    {
      name: 'items',
      type: 'array',
      label: 'Datos de contacto',
      minRows: 1,
      fields: [
        {
          name: 'kind',
          type: 'select',
          label: 'Tipo',
          required: true,
          options: [
            { label: 'Teléfono', value: 'phone' },
            { label: 'Dirección', value: 'location' },
            { label: 'WhatsApp', value: 'whatsapp' },
          ],
        },
        ...linkFields,
      ],
    },
  ],
}
