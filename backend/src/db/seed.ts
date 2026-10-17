import { randomBytes } from 'node:crypto'
import { hashPassword } from '../auth/passwordService.js'
import { db, pool } from './index.js'
import { users } from './schema.js'

const testAccounts: {
  email: string
  passwordEnv: string
  role: 'student' | 'staff' | 'admin'
  status?: 'active' | 'disabled'
}[] = [
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
]

try {
  for (const { email, passwordEnv, ...account } of testAccounts) {
    const password = process.env[passwordEnv] ?? randomBytes(32).toString('base64url')
    const passwordHash = await hashPassword(password)

    await db
      .insert(users)
      .values({ email, ...account, passwordHash })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash,
          role: account.role,
          status: account.status ?? 'active',
        },
      })
  }

  console.log(`Seeded ${testAccounts.length} test users with bcrypt hashes.`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Database seed failed: ${message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
