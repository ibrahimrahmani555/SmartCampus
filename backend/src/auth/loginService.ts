import { verifyPassword } from './passwordService.js'
import { findByEmail } from './userRepository.js'

export type LoginUser = {
  id: string
  email: string
  role: 'student' | 'staff' | 'admin'
}

export type LoginResult =
  | { ok: true; user: LoginUser }
  | {
      ok: false
      reason: 'invalid-credentials' | 'disabled-account' | 'domain-not-allowed'
    }

export async function login(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase()
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase().replace(/^@/, '')
  const emailDomain = normalizedEmail.split('@').at(-1)

  if (!allowedDomain || emailDomain !== allowedDomain) {
    return { ok: false, reason: 'domain-not-allowed' }
  }

  const user = await findByEmail(normalizedEmail)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, reason: 'invalid-credentials' }
  }

  if (user.status === 'disabled') {
    return { ok: false, reason: 'disabled-account' }
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email, role: user.role },
  }
}
