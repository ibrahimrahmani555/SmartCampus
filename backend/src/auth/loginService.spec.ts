import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./userRepository.js', () => ({ findByEmail: vi.fn() }))
vi.mock('./passwordService.js', () => ({ verifyPassword: vi.fn() }))

import { verifyPassword } from './passwordService.js'
import { login } from './loginService.js'
import { findByEmail } from './userRepository.js'

const activeUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'student@smartcampus.test',
  passwordHash: 'bcrypt-hash',
  role: 'student' as const,
  status: 'active' as const,
}

describe('login service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ALLOWED_EMAIL_DOMAIN = 'smartcampus.test'
    vi.mocked(findByEmail).mockResolvedValue(activeUser)
    vi.mocked(verifyPassword).mockResolvedValue(true)
  })

  it('authenticates an active user', async () => {
    await expect(login('STUDENT@SMARTCAMPUS.TEST', 'correct')).resolves.toEqual({
      ok: true,
      user: {
        id: activeUser.id,
        email: activeUser.email,
        role: activeUser.role,
      },
    })
    expect(findByEmail).toHaveBeenCalledWith(activeUser.email)
  })

  it('returns the same invalid-credentials result for an unknown email and a wrong password', async () => {
    vi.mocked(findByEmail).mockResolvedValueOnce(undefined)
    await expect(login(activeUser.email, 'wrong')).resolves.toEqual({
      ok: false,
      reason: 'invalid-credentials',
    })

    vi.mocked(verifyPassword).mockResolvedValueOnce(false)
    await expect(login(activeUser.email, 'wrong')).resolves.toEqual({
      ok: false,
      reason: 'invalid-credentials',
    })
  })

  it('rejects a domain outside the configured institution domain', async () => {
    await expect(login('student@not-smartcampus.test', 'correct')).resolves.toEqual({
      ok: false,
      reason: 'domain-not-allowed',
    })
    expect(findByEmail).not.toHaveBeenCalled()
  })

  it('returns a distinct result for a disabled account after validating its password', async () => {
    vi.mocked(findByEmail).mockResolvedValueOnce({ ...activeUser, status: 'disabled' })

    await expect(login(activeUser.email, 'correct')).resolves.toEqual({
      ok: false,
      reason: 'disabled-account',
    })
  })
})
