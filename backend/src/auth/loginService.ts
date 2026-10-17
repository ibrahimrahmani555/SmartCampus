import { findByEmail } from './userRepository.js'
import { verifyPassword } from './passwordService.js'

export type LoginResult =
  | { success: true; user: NonNullable<Awaited<ReturnType<typeof findByEmail>>> }
  | { success: false; reason: 'invalid_credentials' | 'disabled_account' | 'unauthorized_domain' }

export async function login(email: string, password: string): Promise<LoginResult> {
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase().replace(/^@/, '')
  const normalizedEmail = email.trim().toLowerCase()

  if (!allowedDomain || normalizedEmail.split('@').at(-1) !== allowedDomain) {
    return { success: false, reason: 'unauthorized_domain' }
  }

  const user = await findByEmail(normalizedEmail)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { success: false, reason: 'invalid_credentials' }
  }

  if (user.status !== 'active') {
    return { success: false, reason: 'disabled_account' }
  }

  return { success: true, user }
}
