import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hashResetToken, requestReset, confirmReset, PasswordResetError } from './passwordResetService.js'
import { hashPassword, verifyPassword } from './passwordService.js'

const user = { id: '11111111-1111-4111-8111-111111111111', email: 'student@campus.edu' }

describe('password reset', () => {
  const findActiveUserByEmail = vi.fn()
  const createToken = vi.fn()
  const sendPasswordReset = vi.fn()
  const findValidToken = vi.fn()
  const consumeTokenAndUpdatePassword = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.APP_BASE_URL = 'http://localhost:5173'
  })

  it('creates only a token hash and sends the reset link for an active account', async () => {
    findActiveUserByEmail.mockResolvedValue(user)
    const message = await requestReset(user.email, {
      findActiveUserByEmail, createToken, mailer: { sendPasswordReset },
    })
    const [userId, tokenHash, expiresAt] = createToken.mock.calls[0]
    const link = sendPasswordReset.mock.calls[0][1] as string
    const token = new URL(link).searchParams.get('token')

    expect(message).toBe('Si ce compte existe, un e-mail a été envoyé')
    expect(userId).toBe(user.id)
    expect(tokenHash).toBe(hashResetToken(token!))
    expect(tokenHash).not.toBe(token)
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 59 * 60_000)
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 60 * 60_000)
    expect(link).toMatch(/^http:\/\/localhost:5173\/reset-password\?token=/)
  })

  it('returns the same response without creating a token for an unknown account', async () => {
    findActiveUserByEmail.mockResolvedValue(undefined)
    const result = await requestReset('missing@campus.edu', {
      findActiveUserByEmail, createToken, mailer: { sendPasswordReset },
    })
    expect(result).toBe('Si ce compte existe, un e-mail a été envoyé')
    expect(createToken).not.toHaveBeenCalled()
    expect(sendPasswordReset).not.toHaveBeenCalled()
  })

  it('updates the password and consumes a valid token', async () => {
    findValidToken.mockResolvedValue({ id: 'token-1', userId: user.id })
    await confirmReset('plain-token', 'Campus123', { findValidToken, consumeTokenAndUpdatePassword })
    const [, , passwordHash] = consumeTokenAndUpdatePassword.mock.calls[0]
    expect(findValidToken).toHaveBeenCalledWith(hashResetToken('plain-token'), expect.any(Date))
    expect(consumeTokenAndUpdatePassword).toHaveBeenCalledWith('token-1', user.id, expect.any(String), expect.any(Date))
    await expect(verifyPassword('Campus123', passwordHash)).resolves.toBe(true)
    await expect(verifyPassword('old-password', passwordHash)).resolves.toBe(false)
  })

  it('rejects a reused or expired token', async () => {
    findValidToken.mockResolvedValue(undefined)
    await expect(confirmReset('used-token', 'Campus123', { findValidToken, consumeTokenAndUpdatePassword }))
      .rejects.toBeInstanceOf(PasswordResetError)
    expect(consumeTokenAndUpdatePassword).not.toHaveBeenCalled()
  })

  it('rejects passwords shorter than eight characters or without a digit', async () => {
    await expect(confirmReset('token', 'Camp12', { findValidToken, consumeTokenAndUpdatePassword }))
      .rejects.toThrow('au moins 8 caractères')
    await expect(confirmReset('token', 'CampusPass', { findValidToken, consumeTokenAndUpdatePassword }))
      .rejects.toThrow('au moins un chiffre')
    expect(findValidToken).not.toHaveBeenCalled()
  })

  it('deletes every existing session as part of token consumption', async () => {
    const order: string[] = []
    vi.resetModules()
    vi.doMock('../db/index.js', () => ({ db: {
      transaction: async (callback: (tx: unknown) => Promise<void>) => callback({
        update: () => ({ set: () => ({ where: () => ({ returning: async () => { order.push('consume-token'); return [{ id: 'token-1' }] } }) }) }),
        delete: () => ({ where: async () => { order.push('delete-sessions') } }),
      }),
    } }))
    vi.doMock('../db/schema.js', () => ({ passwordResetTokens: { id: 'token-id', usedAt: 'used-at', expiresAt: 'expires-at' }, sessions: { userId: 'user-id' }, users: { id: 'user-id' } }))
    vi.doMock('drizzle-orm', () => ({ and: (...values: unknown[]) => values, eq: (...values: unknown[]) => values, gt: (...values: unknown[]) => values, isNull: (...values: unknown[]) => values }))
    const { consumeTokenAndUpdatePassword: consume } = await import('./passwordResetRepository.js')
    await consume('token-1', user.id, 'new-hash', new Date())
    expect(order).toEqual(['consume-token', 'delete-sessions'])
    vi.doUnmock('../db/index.js')
    vi.doUnmock('../db/schema.js')
    vi.doUnmock('drizzle-orm')
    vi.resetModules()
  })
})
