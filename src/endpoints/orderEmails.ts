import type { Endpoint } from 'payload'
import { processOrderEmails } from '@/lib/orderEmails'
const handler: Endpoint['handler'] = async (req) => {
  const scheduler =
    Boolean(process.env.CRON_SECRET) &&
    req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  if (!scheduler && !req.user?.roles?.includes('admin')) return new Response(null, { status: 403 })
  return Response.json(await processOrderEmails(req.payload), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
export const orderEmailsPost: Endpoint = { path: '/order-emails/process', method: 'post', handler }
export const orderEmailsGet: Endpoint = { path: '/order-emails/process', method: 'get', handler }
