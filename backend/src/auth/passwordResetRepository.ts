import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import { passwordResetTokens, sessions, users } from '../db/schema.js'

export async function findActiveUserByEmail(email: string) {
  const [user] = await db.select().from(users)
    .where(and(eq(users.email, email.trim().toLowerCase()), eq(users.status, 'active'))).limit(1)
  return user
}

export async function createToken(userId: string, tokenHash: string, expiresAt: Date) {
  const [token] = await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt }).returning()
  return token
}

export async function findValidToken(tokenHash: string, now: Date) {
  const [token] = await db.select().from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, now))).limit(1)
  return token
}

export async function consumeTokenAndUpdatePassword(tokenId: string, userId: string, passwordHash: string, now: Date) {
  await db.transaction(async (tx) => {
    const [consumed] = await tx.update(passwordResetTokens).set({ usedAt: now })
      .where(and(eq(passwordResetTokens.id, tokenId), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, now))).returning()
    if (!consumed) throw new Error('invalid_token')
    await tx.update(users).set({ passwordHash }).where(eq(users.id, userId))
    await tx.delete(sessions).where(eq(sessions.userId, userId))
  })
}
