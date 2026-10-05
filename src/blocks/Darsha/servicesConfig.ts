import type { Block } from 'payload'

const bookingFields = [
  { name: 'bookingLabel', type: 'text' as const, label: 'Texto del botón', required: true },
  { name: 'bookingURL', type: 'text' as const, label: 'Enlace de reserva', required: true },
]

export const DarshaServicesIntro: Block = {
  slug: 'darshaServicesIntro',
  labels: { singular: 'Introducción de servicios', plural: 'Introducciones de servicios' },
  fields: [
    { name: 'heading', type: 'text', label: 'Título', required: true },
    { name: 'intro', type: 'textarea', label: 'Introducción', required: true },
  ],
}

export const DarshaTreatments: Block = {
  slug: 'darshaTreatments',
  labels: { singular: 'Tratamientos', plural: 'Tratamientos' },
  fields: [
    {
      name: 'sectionId',
      type: 'select',
      label: 'Ancla de la sección',
      required: true,
      options: [
        { label: 'Faciales', value: 'faciales' },
        { label: 'Corporales', value: 'corporales' },
      ],
    },
    { name: 'heading', type: 'text', label: 'Título', required: true },
    { name: 'intro', type: 'textarea', label: 'Introducción', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Imagen', required: true },
    {
      name: 'imageSide',
      type: 'select',
      label: 'Posición de la imagen',
      required: true,
      defaultValue: 'right',
      options: [
        { label: 'Derecha', value: 'right' },
        { label: 'Izquierda', value: 'left' },
      ],
    },
    {
      name: 'background',
      type: 'select',
      label: 'Fondo',
      required: true,
      defaultValue: 'white',
      options: [
        { label: 'Blanco', value: 'white' },
        { label: 'Beige', value: 'beige' },
        { label: 'Blanco cálido', value: 'warmWhite' },
      ],
    },
    {
      name: 'showPrices',
      type: 'checkbox',
      label: 'Mostrar precios de tratamientos',
      defaultValue: false,
      admin: { description: 'Los precios configurados permanecen ocultos hasta activar esta opción.' },
    },
    {
      name: 'treatments',
      type: 'array',
      label: 'Tratamientos',
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', label: 'Nombre', required: true },
        { name: 'description', type: 'textarea', label: 'Descripción', required: true },
        { name: 'duration', type: 'text', label: 'Duración', required: true },
        { name: 'frequency', type: 'text', label: 'Frecuencia opcional' },
        { name: 'price', type: 'text', label: 'Precio opcional (UYU)' },
      ],
    },
    ...bookingFields,
  ],
}

export const DarshaBookingCTA: Block = {
  slug: 'darshaBookingCTA',
  labels: { singular: 'Llamado a reservar', plural: 'Llamados a reservar' },
  fields: [
    { name: 'heading', type: 'text', label: 'Título', required: true },
    ...bookingFields,
  ],
}
