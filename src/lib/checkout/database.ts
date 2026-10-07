import { sql, type VercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import type { PayloadRequest } from 'payload'

export async function inCheckoutTransaction<T>(
  req: PayloadRequest,
  work: (
    request: PayloadRequest,
    db: VercelPostgresAdapter['sessions'][string]['db'],
  ) => Promise<T>,
): Promise<T> {
  const adapter = req.payload.db as unknown as VercelPostgresAdapter
  const requested = req.transactionID ? String(await req.transactionID) : null
  // Payload can leave a completed transaction ID on a reused request.
  const inherited = requested && adapter.sessions[requested] ? requested : null
  const transactionID = inherited || (await adapter.beginTransaction())
  if (!transactionID) throw new Error('Checkout requires database transactions')
  const request = {
    ...req,
    transactionID,
    context: { ...req.context, checkoutInternal: true, disableRevalidate: true },
  } as PayloadRequest
  try {
    const result = await work(request, adapter.sessions[String(transactionID)].db)
    if (!inherited) await adapter.commitTransaction(transactionID)
    return result
  } catch (error) {
    if (!inherited) await adapter.rollbackTransaction(transactionID)
    throw error
  }
}
export { sql }
