import { randomBytes } from 'node:crypto'
import { db, pool } from './index.js'
import { users } from './schema.js'
import { hashPassword } from '../auth/passwordService.js'

const testAccounts = [
  {
    email: 'student@smartcampus.test',
    passwordEnv: 'SMARTCAMPUS_STUDENT_TEST_PASSWORD',
    role: 'student',
  },
  {
    email: 'staff@smartcampus.test',
    passwordEnv: 'SMARTCAMPUS_STAFF_TEST_PASSWORD',
    role: 'staff',
  },
  {
    email: 'admin@smartcampus.test',
    passwordEnv: 'SMARTCAMPUS_ADMIN_TEST_PASSWORD',
    role: 'admin',
    status: 'disabled',
  },
] as const

try {
  const testUsers: (typeof users.$inferInsert)[] = await Promise.all(
    testAccounts.map(async ({ email, passwordEnv, ...account }) => {
      const password = process.env[passwordEnv] ?? randomBytes(32).toString('base64url')

      return {
        email,
        ...account,
        passwordHash: await hashPassword(password),
      }
    }),
  )

  for (const user of testUsers) {
    await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash: user.passwordHash,
          role: user.role,
          status: user.status ?? 'active',
        },
      })
  }
  console.log(`Seeded ${testUsers.length} test users with bcrypt hashes.`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Database seed failed: ${message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
