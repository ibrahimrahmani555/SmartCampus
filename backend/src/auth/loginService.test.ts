import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findByEmail, verifyPassword } = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  verifyPassword: vi.fn(),
}))

vi.mock('./userRepository.js', () => ({ findByEmail }))
vi.mock('./passwordService.js', () => ({ verifyPassword }))

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
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
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
