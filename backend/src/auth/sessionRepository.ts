import { and, eq, gt } from 'drizzle-orm'
import { db } from '../db/index.js'
import { sessions, users } from '../db/schema.js'

export async function createSession(userId: string, expiresAt: Date) {
  const [session] = await db
    .insert(sessions)
    .values({ userId, expiresAt })
    .returning({ id: sessions.id })

  return session.id
}

export async function findActiveSession(sessionId: string) {
  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.id, sessionId),
        gt(sessions.expiresAt, new Date()),
        eq(users.status, 'active'),
      ),
    )
    .limit(1)

  return user
}
