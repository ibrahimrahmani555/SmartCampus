import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findWithUser, extend, remove } = vi.hoisted(() => ({ findWithUser: vi.fn(), extend: vi.fn(), remove: vi.fn() }))
vi.mock('./sessionRepository.js', () => ({ findWithUser, extend, remove }))

import app from '../index.js'

const user = { id: 'user-1', email: 'student@campus.edu', role: 'student', status: 'active' }

describe('sessions HTTP', () => {
  beforeEach(() => {
    findWithUser.mockReset()
    extend.mockReset().mockResolvedValue(undefined)
    remove.mockReset().mockResolvedValue(undefined)
    process.env.SESSION_TIMEOUT_MINUTES = '30'
  })

  it('renews expiry on valid /me and marks it no-store', async () => {
    findWithUser.mockResolvedValue({ session: { id: 'session-1', expiresAt: new Date(Date.now() + 60_000) }, user })
    const before = Date.now()
    const response = await app.request('/api/auth/me', { headers: { cookie: 'smartcampus_session=session-1' } })
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const renewedExpiry = extend.mock.calls[0]?.[1] as Date
    expect(renewedExpiry.getTime()).toBeGreaterThanOrEqual(before + 30 * 60_000)
    expect(renewedExpiry.getTime()).toBeLessThanOrEqual(Date.now() + 30 * 60_000)
  })

  it('rejects and removes an expired session', async () => {
    findWithUser.mockResolvedValue({ session: { id: 'session-1', expiresAt: new Date(Date.now() - 1000) }, user })
    const response = await app.request('/api/auth/me', { headers: { cookie: 'smartcampus_session=session-1' } })
    expect(response.status).toBe(401)
    expect(remove).toHaveBeenCalledWith('session-1')
    expect(response.headers.get('set-cookie')).toContain('smartcampus_session=;')
  })

  it('logout deletes the session and /me then rejects it', async () => {
    const requestOptions = { headers: { cookie: 'smartcampus_session=session-1' } }
    const logout = await app.request('/api/auth/logout', { method: 'POST', ...requestOptions })
    expect(logout.status).toBe(204)
    expect(remove).toHaveBeenCalledWith('session-1')
    findWithUser.mockResolvedValue(undefined)
    expect((await app.request('/api/auth/me', requestOptions)).status).toBe(401)
  })

  it('logout succeeds without a session', async () => {
    const response = await app.request('/api/auth/logout', { method: 'POST' })
    expect(response.status).toBe(204)
    expect(remove).not.toHaveBeenCalled()
  })
})
