import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { AuthProvider, useAuth } from '@/providers/Auth'
function Probe() {
  const auth = useAuth()
  return createElement('p', null, auth.user ? 'signed in' : auth.status || 'loading')
}
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
describe('guest authentication on public checkout origins', () => {
  it('fetches the account from the current origin', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user: { id: 1 } }) })
    vi.stubGlobal('fetch', fetch)
    render(createElement(AuthProvider, null, createElement(Probe)))
    await waitFor(() => expect(screen.getByText('signed in')).toBeTruthy())
    expect(fetch).toHaveBeenCalledWith(
      '/api/users/me',
      expect.objectContaining({ credentials: 'include' }),
    )
  })
  it('does not throw an unhandled exception when account lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')))
    render(createElement(AuthProvider, null, createElement(Probe)))
    await waitFor(() => expect(screen.getByText('loggedOut')).toBeTruthy())
  })
})
