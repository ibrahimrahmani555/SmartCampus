import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCurrentUser, login, logout } from './auth'

afterEach(() => vi.unstubAllGlobals())

describe('auth service', () => {
  it('sends login credentials and returns the authenticated user', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ email: 'student@campus.edu', role: 'student' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(login('student@campus.edu', 'Campus123')).resolves.toEqual({
      email: 'student@campus.edu',
      role: 'student',
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@campus.edu', password: 'Campus123' }),
    })
  })

  it('rejects login with the server error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ code: 'INVALID_CREDENTIALS', message: 'E-mail ou mot de passe incorrect' }),
    }))

    await expect(login('student@campus.edu', 'wrong')).rejects.toThrow(
      'E-mail ou mot de passe incorrect',
    )
  })

  it('returns null when there is no active session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401, ok: false }))

    await expect(getCurrentUser()).resolves.toBeNull()
  })

  it('sends logout with the session cookie', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 })
    vi.stubGlobal('fetch', fetchMock)
    await expect(logout()).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST', credentials: 'include' })
  })
})
