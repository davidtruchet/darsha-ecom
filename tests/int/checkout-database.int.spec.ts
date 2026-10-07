import { describe, expect, it, vi } from 'vitest'
import type { PayloadRequest } from 'payload'
import { inCheckoutTransaction } from '@/lib/checkout/database'
function setup(transactionID?: string) {
  const sessions: Record<string, { db: { execute: ReturnType<typeof vi.fn> } }> = {}
  const db = { execute: vi.fn() }
  const adapter = {
    sessions,
    beginTransaction: vi.fn(async () => {
      sessions.fresh = { db }
      return 'fresh'
    }),
    commitTransaction: vi.fn(async () => {
      delete sessions.fresh
    }),
    rollbackTransaction: vi.fn(async () => {
      delete sessions.fresh
    }),
  }
  return {
    adapter,
    db,
    req: { payload: { db: adapter }, transactionID, context: {} } as unknown as PayloadRequest,
  }
}
describe('checkout database transaction ownership', () => {
  it('starts a fresh transaction when Payload retains a completed request transaction ID', async () => {
    const { adapter, db, req } = setup('closed')
    const result = await inCheckoutTransaction(req, async (request, connection) => {
      expect(request.transactionID).toBe('fresh')
      expect(request.context.checkoutInternal).toBe(true)
      expect(connection).toBe(db)
      return 'saved'
    })
    expect(result).toBe('saved')
    expect(adapter.commitTransaction).toHaveBeenCalledWith('fresh')
  })
  it('inherits an active admin transaction without committing its parent', async () => {
    const { adapter, db, req } = setup('admin')
    adapter.sessions.admin = { db }
    await inCheckoutTransaction(req, async () => {})
    expect(adapter.beginTransaction).not.toHaveBeenCalled()
    expect(adapter.commitTransaction).not.toHaveBeenCalled()
  })
  it('rolls back its own failed stock/order changes', async () => {
    const { adapter, req } = setup()
    await expect(
      inCheckoutTransaction(req, async () => {
        throw new Error('stock conflict')
      }),
    ).rejects.toThrow('stock conflict')
    expect(adapter.rollbackTransaction).toHaveBeenCalledWith('fresh')
    expect(adapter.commitTransaction).not.toHaveBeenCalled()
  })
})
