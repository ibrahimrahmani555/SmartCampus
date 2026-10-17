import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'

type UserRole = (typeof users.$inferInsert)['role']

export async function findByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1)

  return user
}

export async function create({
  email,
  passwordHash,
  role = 'student',
}: {
  email: string
  passwordHash: string
  role?: UserRole
}) {
  const [user] = await db
    .insert(users)
    .values({ email: email.trim().toLowerCase(), passwordHash, role })
    .returning()

  return user
}
