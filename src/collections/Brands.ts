import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: { singular: 'Marca', plural: 'Marcas' },
  admin: { useAsTitle: 'title', group: 'Contenido' },
  access: { create: adminOnly, read: () => true, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Nombre' },
    slugField({ position: undefined }),
  ],
}
