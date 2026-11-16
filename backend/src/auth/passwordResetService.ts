import { createHash, randomBytes } from 'node:crypto'
import { passwordSchema } from './passwordRules.js'
import { hashPassword } from './passwordService.js'
import { mailSender, type MailSender } from './mailSender.js'
import * as repository from './passwordResetRepository.js'

const RESET_MESSAGE = 'Si ce compte existe, un e-mail a été envoyé'

export class PasswordResetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PasswordResetError'
  }
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function requestReset(
  email: string,
  dependencies: { mailer?: MailSender; findActiveUserByEmail?: typeof repository.findActiveUserByEmail; createToken?: typeof repository.createToken } = {},
): Promise<string> {
  const user = await (dependencies.findActiveUserByEmail ?? repository.findActiveUserByEmail)(email)
  if (!user) return RESET_MESSAGE

  const token = randomBytes(32).toString('hex')
  await (dependencies.createToken ?? repository.createToken)(user.id, hashResetToken(token), new Date(Date.now() + 60 * 60_000))
  const baseUrl = (process.env.APP_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '')
  const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`
  await (dependencies.mailer ?? mailSender).sendPasswordReset(user.email, link)
  return RESET_MESSAGE
}

export async function confirmReset(
  token: string,
  newPassword: string,
  dependencies: {
    findValidToken?: typeof repository.findValidToken
    consumeTokenAndUpdatePassword?: typeof repository.consumeTokenAndUpdatePassword
    hashPassword?: typeof hashPassword
  } = {},
): Promise<void> {
  const parsedPassword = passwordSchema.safeParse(newPassword)
  if (!parsedPassword.success) throw new PasswordResetError(parsedPassword.error.issues[0]?.message ?? 'Mot de passe invalide.')

  const tokenHash = hashResetToken(token)
  const resetToken = await (dependencies.findValidToken ?? repository.findValidToken)(tokenHash, new Date())
  if (!resetToken) throw new PasswordResetError('Ce lien de réinitialisation est invalide, expiré ou déjà utilisé.')

  const passwordHash = await (dependencies.hashPassword ?? hashPassword)(parsedPassword.data)
  try {
    await (dependencies.consumeTokenAndUpdatePassword ?? repository.consumeTokenAndUpdatePassword)(resetToken.id, resetToken.userId, passwordHash, new Date())
  } catch (error) {
    if (error instanceof Error && error.message === 'invalid_token') {
      throw new PasswordResetError('Ce lien de réinitialisation est invalide, expiré ou déjà utilisé.')
    }
    throw error
  }
}
