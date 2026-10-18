import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { loginAttempts } from '../db/schema.js'

export async function recordAttempt(email: string, succeeded: boolean) {
  await db.insert(loginAttempts).values({ email: email.trim().toLowerCase(), succeeded })
}

export async function countRecentFailures(email: string) {
  const attempts = await db
    .select({ succeeded: loginAttempts.succeeded })
    .from(loginAttempts)
    .where(eq(loginAttempts.email, email.trim().toLowerCase()))
    .orderBy(desc(loginAttempts.createdAt), desc(loginAttempts.id))

  let failures = 0
  for (const attempt of attempts) {
    if (attempt.succeeded) break
    failures += 1
  }
  return failures
}
