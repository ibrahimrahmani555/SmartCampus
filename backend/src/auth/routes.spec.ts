import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./loginService.js', () => ({ login: vi.fn() }))
vi.mock('./sessionRepository.js', () => ({
  createSession: vi.fn(),
  findActiveSession: vi.fn(),
}))

import app from '../index.js'
import { login } from './loginService.js'
import { createSession, findActiveSession } from './sessionRepository.js'

const sessionId = '550e8400-e29b-41d4-a716-446655440001'
const user = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'student@smartcampus.test',
  role: 'student' as const,
}

describe('authentication routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createSession).mockResolvedValue(sessionId)
  })

  it('creates a 30-minute httpOnly session cookie on successful login', async () => {
    vi.mocked(login).mockResolvedValue({ ok: true, user })

    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'valid-password' }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ email: user.email, role: user.role })
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(response.headers.get('set-cookie')).toContain('Max-Age=1800')
    expect(createSession).toHaveBeenCalledWith(user.id, expect.any(Date))
  })

  it.each([
    [{ ok: false, reason: 'invalid-credentials' }, 401, 'E-mail ou mot de passe incorrect'],
    [
      { ok: false, reason: 'disabled-account' },
      403,
      "Ce compte est désactivé. Veuillez contacter l'administration.",
    ],
    [
      { ok: false, reason: 'domain-not-allowed' },
      403,
      'Utilisez une adresse e-mail de votre établissement.',
    ],
  ] as const)('returns safe error details for a failed login', async (result, status, message) => {
    vi.mocked(login).mockResolvedValue(result)

    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'valid-password' }),
    })

    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({ message })
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('validates the login body before calling the service', async () => {
    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid', password: '' }),
    })

    expect(response.status).toBe(400)
    expect(login).not.toHaveBeenCalled()
  })

  it('returns the current user for an active session', async () => {
    vi.mocked(findActiveSession).mockResolvedValue(user)

    const response = await app.request('/api/auth/me', {
      headers: { Cookie: `smartcampus_session=${sessionId}` },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ email: user.email, role: user.role })
  })

  it('returns 401 when the session cookie is missing', async () => {
    const response = await app.request('/api/auth/me')

    expect(response.status).toBe(401)
    expect(findActiveSession).not.toHaveBeenCalled()
  })
})
