import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findByEmail, verifyPassword, recordAttempt, countRecentFailures, securityLogger } = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  verifyPassword: vi.fn(),
  recordAttempt: vi.fn(),
  countRecentFailures: vi.fn(),
  securityLogger: vi.fn(),
}))

vi.mock('./userRepository.js', () => ({ findByEmail }))
vi.mock('./passwordService.js', () => ({ verifyPassword }))
vi.mock('./loginAttemptRepository.js', () => ({ recordAttempt, countRecentFailures }))
vi.mock('./securityLogger.js', () => ({ logRepeatedLoginFailures: securityLogger }))

import { login } from './loginService.js'
import app from '../index.js'
import * as sessionRepository from './sessionRepository.js'

const user = {
  id: 'user-1',
  email: 'student@campus.edu',
  passwordHash: 'hash',
  role: 'student',
  status: 'active',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('loginService', () => {
  const repository = { findByEmail: vi.fn() }

  beforeEach(() => {
    process.env.ALLOWED_EMAIL_DOMAIN = 'campus.edu'
    repository.findByEmail.mockReset()
    verifyPassword.mockReset()
    recordAttempt.mockReset().mockResolvedValue(undefined)
    countRecentFailures.mockReset().mockResolvedValue(0)
    securityLogger.mockReset()
  })

  it('succeeds with valid credentials', async () => {
    repository.findByEmail.mockResolvedValue(user)
    verifyPassword.mockResolvedValue(true)

    await expect(login('student@campus.edu', 'Campus123', repository)).resolves.toEqual({
      success: true,
      user,
    })
    expect(repository.findByEmail).toHaveBeenCalledWith('student@campus.edu')
  })

  it('rejects an incorrect password with invalid credentials', async () => {
    repository.findByEmail.mockResolvedValue(user)
    verifyPassword.mockResolvedValue(false)

    await expect(login('student@campus.edu', 'wrong', repository)).resolves.toEqual({
      success: false,
      reason: 'invalid_credentials',
    })
  })

  it('keeps the generic message and records a security event after three consecutive failures', async () => {
    repository.findByEmail.mockResolvedValue(user)
    verifyPassword.mockResolvedValue(false)
    countRecentFailures.mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(3)

    const responses = []
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await login(user.email, `wrong-${attempt}`, repository)
      responses.push(result.success ? '' : 'E-mail ou mot de passe incorrect')
    }

    expect(responses).toEqual([
      'E-mail ou mot de passe incorrect',
      'E-mail ou mot de passe incorrect',
      'E-mail ou mot de passe incorrect',
    ])
    expect(recordAttempt).toHaveBeenCalledTimes(3)
    expect(securityLogger).toHaveBeenCalledWith(user.email, 3)
    expect(JSON.stringify(securityLogger.mock.calls)).not.toContain('wrong-')
  })

  it('returns the same invalid credentials result for an unknown email', async () => {
    repository.findByEmail.mockResolvedValue(undefined)

    await expect(login('missing@campus.edu', 'Campus123', repository)).resolves.toEqual({
      success: false,
      reason: 'invalid_credentials',
    })
    expect(verifyPassword).not.toHaveBeenCalled()
  })

  it('rejects a disabled account', async () => {
    repository.findByEmail.mockResolvedValue({ ...user, status: 'disabled' })
    verifyPassword.mockResolvedValue(true)

    await expect(login('student@campus.edu', 'Campus123', repository)).resolves.toEqual({
      success: false,
      reason: 'disabled_account',
    })
  })

  it('rejects an email outside the allowed domain', async () => {
    await expect(login('student@elsewhere.edu', 'Campus123', repository)).resolves.toEqual({
      success: false,
      reason: 'unauthorized_domain',
    })
    expect(repository.findByEmail).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    process.env.ALLOWED_EMAIL_DOMAIN = 'campus.edu'
    findByEmail.mockReset()
    verifyPassword.mockReset()
    vi.spyOn(sessionRepository, 'create').mockResolvedValue({
      id: 'session-1',
      userId: user.id,
      expiresAt: new Date('2026-01-01T00:30:00.000Z'),
    })
  })

  it('returns 200 for valid credentials', async () => {
    findByEmail.mockResolvedValue(user)
    verifyPassword.mockResolvedValue(true)

    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'Campus123' }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ email: user.email, role: user.role })
  })

  it('returns 401 for incorrect credentials', async () => {
    findByEmail.mockResolvedValue(user)
    verifyPassword.mockResolvedValue(false)

    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'wrong' }),
    })

    expect(response.status).toBe(401)
  })

  it('returns 400 for an invalid body', async () => {
    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '' }),
    })

    expect(response.status).toBe(400)
  })
})
