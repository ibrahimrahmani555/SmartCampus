import { findByEmail } from './userRepository.js'
import { verifyPassword } from './passwordService.js'
import { countRecentFailures, recordAttempt } from './loginAttemptRepository.js'
import { logRepeatedLoginFailures } from './securityLogger.js'

export type LoginResult =
  | { success: true; user: NonNullable<Awaited<ReturnType<typeof findByEmail>>> }
  | { success: false; reason: 'invalid_credentials' | 'disabled_account' | 'unauthorized_domain' }

type UserRepository = { findByEmail: typeof findByEmail }
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
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase().replace(/^@/, '')
  const normalizedEmail = email.trim().toLowerCase()

  if (!allowedDomain || normalizedEmail.split('@').at(-1) !== allowedDomain) {
    return { success: false, reason: 'unauthorized_domain' }
  }

  const user = await userRepository.findByEmail(normalizedEmail)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await attemptRepository.recordAttempt(normalizedEmail, false)
    const failureCount = await attemptRepository.countRecentFailures(normalizedEmail)
    if (failureCount === 3) logRepeatedLoginFailures(normalizedEmail, failureCount)
    return { success: false, reason: 'invalid_credentials' }
  }

  if (user.status !== 'active') {
    await attemptRepository.recordAttempt(normalizedEmail, false)
    return { success: false, reason: 'disabled_account' }
  }

  await attemptRepository.recordAttempt(normalizedEmail, true)
  return { success: true, user }
}
