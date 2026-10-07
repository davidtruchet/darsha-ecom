import type { Endpoint } from 'payload'
import { calculateShippingQuote, type ShippingDestination } from '@/utilities/shippingQuote'

export const shippingQuoteEndpoint: Endpoint = {
  path: '/shipping/quote',
  method: 'post',
  handler: async (req) => {
    let body: { cartID?: unknown; secret?: unknown; destination?: ShippingDestination }
    try {
      body = await req.json!()
    } catch {
      return Response.json({ message: 'Solicitud inválida.' }, { status: 400 })
    }
    if (
      !body ||
      !Number.isSafeInteger(body.cartID) ||
      !body.destination ||
      !['pickup', 'delivery'].includes(body.destination.method) ||
      (body.destination.department != null && typeof body.destination.department !== 'string') ||
      (body.destination.locality != null &&
        (typeof body.destination.locality !== 'string' || body.destination.locality.length > 150))
    )
      return Response.json({ message: 'Solicitud inválida.' }, { status: 400 })
    try {
      req.context.cartSecret = typeof body.secret === 'string' ? body.secret : undefined
      const cart = await req.payload.findByID({
        collection: 'carts',
        id: body.cartID as number,
        depth: 0,
        overrideAccess: false,
        req,
      })
      if (cart.status !== 'active' || cart.purchasedAt)
        return Response.json(
          { available: false, message: 'Este carrito ya no está activo.' },
          { status: 409 },
        )
      const cartItems = cart.items || []
      const ids = cartItems
        .map((item) => (typeof item.product === 'object' ? item.product?.id : item.product))
        .filter((id): id is number => typeof id === 'number')
      const products = ids.length
        ? await req.payload.find({
            collection: 'products',
            overrideAccess: false,
            req,
            depth: 0,
            limit: ids.length,
            where: { and: [{ id: { in: ids } }, { _status: { equals: 'published' } }] },
            select: { shippingWeightGrams: true },
          })
        : { docs: [] }
      const items = cartItems.map((item) => ({
        quantity: item.quantity,
        product:
          products.docs.find(
            (product) =>
              product.id === (typeof item.product === 'object' ? item.product?.id : item.product),
          ) || null,
      }))
      if (items.some((item) => !item.product))
        return Response.json({
          available: false,
          message: 'Hay productos que ya no están disponibles.',
        })
      const settings = await req.payload.findGlobal({
        slug: 'shipping',
        depth: 0,
        overrideAccess: false,
        req,
      })
      return Response.json(calculateShippingQuote(body.destination, items, settings), {
        headers: { 'Cache-Control': 'no-store' },
      })
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'status' in error ? Number(error.status) : 500
      if (status === 403 || status === 404)
        return Response.json({ message: 'No pudimos acceder a este carrito.' }, { status: 403 })
      req.payload.logger.error({ msg: 'Shipping quote failed' })
      return Response.json(
        { message: 'No pudimos calcular el envío. Intenta nuevamente.' },
        { status: 503 },
      )
    }
  },
}
