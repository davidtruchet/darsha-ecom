import { releaseAttempt } from '@/lib/checkout/settlement'
import { currenciesConfig } from '@/lib/currencies'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'

import { Page, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { ProductsCollection } from '@/collections/Products'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'

const generateTitle: GenerateTitle<Product | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Espacio Darsha` : 'Espacio Darsha'
}

const generateURL: GenerateURL<Product | Page> = ({ doc, collectionConfig }) => {
  const url = getServerSideURL()

  if (!doc?.slug) return url
  if (collectionConfig?.slug === 'products') return `${url}/products/${doc.slug}`
  return doc.slug === 'home' ? url : `${url}/${doc.slug}`
}

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: 'Content',
      },
    },
    formOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
        create: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  ecommercePlugin({
    currencies: currenciesConfig,
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    customers: {
      slug: 'users',
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        hooks: {
          ...defaultCollection.hooks,
          afterChange: [
            ...(defaultCollection.hooks?.afterChange || []),
            async ({ doc, previousDoc, req }) => {
              if (
                !req.context.checkoutInternal &&
                doc.status === 'cancelled' &&
                previousDoc?.status !== 'cancelled' &&
                doc.paymentState === 'pending' &&
                doc.checkoutReference
              ) {
                const found = await req.payload.find({
                  collection: 'checkout-attempts',
                  limit: 1,
                  depth: 0,
                  req,
                  where: { reference: { equals: doc.checkoutReference } },
                })
                const attempt = found.docs[0]
                if (attempt && attempt.method !== 'mercadopago')
                  await releaseAttempt(req, attempt.id, 'cancelled')
              }
              return doc
            },
          ],
        },
        fields: [
          ...defaultCollection.fields,
          { name: 'checkoutReference', type: 'text', unique: true, admin: { readOnly: true } },
          {
            name: 'paymentState',
            type: 'select',
            options: ['pending', 'paid', 'review', 'cancelled'],
            admin: { readOnly: true },
          },
          { name: 'paymentProvider', type: 'text', admin: { readOnly: true } },
          { name: 'deliveryDetails', type: 'json', admin: { readOnly: true } },
          { name: 'shippingAmount', type: 'number', admin: { readOnly: true } },
          { name: 'purchaseSnapshot', type: 'json', admin: { readOnly: true } },
          {
            name: 'accessToken',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              beforeValidate: [
                ({ value, operation }) => {
                  if (operation === 'create' || !value) {
                    return crypto.randomUUID()
                  }
                  return value
                },
              ],
            },
          },
        ],
      }),
    },
    payments: { paymentMethods: [] },
    transactions: {
      transactionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...defaultCollection.fields,
          // Keep historical columns readable without registering a Stripe adapter.
          {
            name: 'paymentMethod',
            type: 'select',
            options: ['stripe'],
            admin: { hidden: true, readOnly: true },
          },
          {
            name: 'stripe',
            type: 'group',
            admin: { hidden: true, readOnly: true },
            fields: [
              { name: 'customerID', type: 'text' },
              { name: 'paymentIntentID', type: 'text' },
            ],
          },
          { name: 'paymentProvider', type: 'text', admin: { readOnly: true } },
          { name: 'paymentReference', type: 'text', unique: true, admin: { readOnly: true } },
        ],
      }),
    },
    products: {
      productsCollectionOverride: ProductsCollection,
    },
  }),
]
