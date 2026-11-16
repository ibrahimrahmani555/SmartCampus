import { findByEmail, setLockedUntil } from './userRepository.js'
import { verifyPassword } from './passwordService.js'
import { countRecentFailures, recordAttempt } from './loginAttemptRepository.js'
import { logRepeatedLoginFailures } from './securityLogger.js'

export type LoginResult =
  | { success: true; user: NonNullable<Awaited<ReturnType<typeof findByEmail>>> }
  | { success: false; reason: 'invalid_credentials' | 'disabled_account' | 'unauthorized_domain' | 'account_locked' }

type UserRepository = { findByEmail: typeof findByEmail; setLockedUntil?: typeof setLockedUntil }
type AttemptRepository = {
  recordAttempt: typeof recordAttempt
  countRecentFailures: typeof countRecentFailures
}

export async function login(
  email: string,
  password: string,
  userRepository: UserRepository = { findByEmail },
  attemptRepository: AttemptRepository = { recordAttempt, countRecentFailures },
): Promise<LoginResult> {
  const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAIN ?? '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean)
  // Permit personal Gmail accounts in local development, even with a stale shell env value.
  if (process.env.NODE_ENV !== 'production') allowedDomains.push('gmail.com')
  const normalizedEmail = email.trim().toLowerCase()
  const emailDomain = normalizedEmail.split('@').at(-1)

  if (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain ?? '')) {
    return { success: false, reason: 'unauthorized_domain' }
  }

  const user = await userRepository.findByEmail(normalizedEmail)
  if (!user) {
    await attemptRepository.recordAttempt(normalizedEmail, false)
    return { success: false, reason: 'invalid_credentials' }
  }

  const now = new Date()
  if (user.lockedUntil && user.lockedUntil > now) return { success: false, reason: 'account_locked' }
  if (user.lockedUntil && user.lockedUntil <= now) await userRepository.setLockedUntil?.(user.id, null)

  if (!(await verifyPassword(password, user.passwordHash))) {
    await attemptRepository.recordAttempt(normalizedEmail, false)
    const failureCount = await attemptRepository.countRecentFailures(normalizedEmail)
    const maxFailedAttempts = Number(process.env.MAX_FAILED_ATTEMPTS ?? 5)
    const lockMinutes = Number(process.env.LOCK_MINUTES ?? 15)
    if (failureCount === 3) logRepeatedLoginFailures(normalizedEmail, failureCount)
    if (failureCount >= maxFailedAttempts) {
      await userRepository.setLockedUntil?.(user.id, new Date(now.getTime() + lockMinutes * 60_000))
      return { success: false, reason: 'account_locked' }
    }
    return { success: false, reason: 'invalid_credentials' }
  }

  if (user.status !== 'active') {
    await attemptRepository.recordAttempt(normalizedEmail, false)
    return { success: false, reason: 'disabled_account' }
  }

  await userRepository.setLockedUntil?.(user.id, null)
  await attemptRepository.recordAttempt(normalizedEmail, true)
  return { success: true, user }
}
