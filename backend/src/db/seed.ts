import { db, pool } from './index.js'
import { users } from './schema.js'

const testUsers: (typeof users.$inferInsert)[] = [
  {
    email: 'student@smartcampus.test',
    passwordHash: 'fake-hash-for-sc25',
    role: 'student',
  },
  {
    email: 'staff@smartcampus.test',
    passwordHash: 'fake-hash-for-sc25',
    role: 'staff',
  },
  {
    email: 'admin@smartcampus.test',
    passwordHash: 'fake-hash-for-sc25',
    role: 'admin',
    status: 'disabled',
  },
]

try {
  await db.insert(users).values(testUsers).onConflictDoNothing({ target: users.email })
  console.log(`Seeded ${testUsers.length} test users (existing emails were left unchanged).`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Database seed failed: ${message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
