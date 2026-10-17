import { and, eq, gt } from 'drizzle-orm'
import { db } from '../db/index.js'
import { sessions, users } from '../db/schema.js'

export async function create(userId: string, expiresAt: Date) {
  const [session] = await db.insert(sessions).values({ userId, expiresAt }).returning()
  return session
}

export async function findActiveWithUser(id: string, now = new Date()) {
  const [result] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, now), eq(users.status, 'active')))
    .limit(1)

  return result
}
