import { describe, expect, it } from 'vitest'
import { passwordSchema } from './passwordRules.js'
import { hashPassword, verifyPassword } from './passwordService.js'

describe('passwordService', () => {
  it('stores a bcrypt hash instead of the plain password', async () => {
    const plain = 'TestPass123'
    const hash = await hashPassword(plain)

    expect(hash).not.toBe(plain)
    expect(hash).toMatch(/^\$2[aby]\$10\$/)
  })

  it('uses a fresh salt for each hash', async () => {
    const plain = 'TestPass123'

    await expect(hashPassword(plain)).resolves.not.toBe(await hashPassword(plain))
  })

  it('verifies matching and non-matching passwords', async () => {
    const hash = await hashPassword('TestPass123')

    await expect(verifyPassword('TestPass123', hash)).resolves.toBe(true)
    await expect(verifyPassword('WrongPass123', hash)).resolves.toBe(false)
  })
})

describe('passwordSchema', () => {
  it('requires at least eight characters and one digit', () => {
    expect(passwordSchema.safeParse('Campus123').success).toBe(true)
    expect(passwordSchema.safeParse('Campusxx').success).toBe(false)
    expect(passwordSchema.safeParse('A1short').success).toBe(false)
  })
})
