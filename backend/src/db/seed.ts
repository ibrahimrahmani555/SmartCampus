import { randomBytes } from 'node:crypto'
import { like, sql } from 'drizzle-orm'
import { db, pool } from './index.js'
import { rooms, users } from './schema.js'
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

const seedRooms: (typeof rooms.$inferInsert)[] = [
  { name: 'Amphi Lumière', building: 'Bâtiment A', floor: 0, capacity: 200, equipment: ['projecteur', 'wifi', 'tableau', 'prises', 'visioconférence'], isActive: true },
  { name: 'Salle Atlas', building: 'Bâtiment A', floor: 1, capacity: 48, equipment: ['projecteur', 'wifi', 'tableau', 'prises'], isActive: true },
  { name: 'Salle Cèdre', building: 'Bâtiment A', floor: 1, capacity: 24, equipment: ['wifi', 'tableau', 'prises'], isActive: true },
  { name: 'Salle Delta', building: 'Bâtiment A', floor: 2, capacity: 72, equipment: ['projecteur', 'wifi', 'tableau', 'visioconférence'], isActive: true },
  { name: 'Salle Érable', building: 'Bâtiment A', floor: 2, capacity: 12, equipment: ['wifi', 'tableau'], isActive: true },
  { name: 'Salle Iris', building: 'Bâtiment A', floor: 3, capacity: 36, equipment: ['projecteur', 'wifi', 'prises'], isActive: false },
  { name: 'Salle Jade', building: 'Bâtiment A', floor: 3, capacity: 60, equipment: ['projecteur', 'wifi', 'tableau', 'prises'], isActive: true },
  { name: 'Forum Newton', building: 'Bâtiment B', floor: 0, capacity: 180, equipment: ['projecteur', 'wifi', 'tableau', 'prises', 'visioconférence'], isActive: true },
  { name: 'Salle Orion', building: 'Bâtiment B', floor: 1, capacity: 30, equipment: ['wifi', 'tableau', 'prises'], isActive: true },
  { name: 'Salle Pixel', building: 'Bâtiment B', floor: 1, capacity: 54, equipment: ['projecteur', 'wifi', 'tableau'], isActive: true },
  { name: 'Salle Quartz', building: 'Bâtiment B', floor: 2, capacity: 96, equipment: ['projecteur', 'wifi', 'prises', 'visioconférence'], isActive: true },
  { name: 'Salle Rive', building: 'Bâtiment B', floor: 2, capacity: 18, equipment: ['wifi', 'tableau'], isActive: false },
  { name: 'Salle Solaris', building: 'Bâtiment B', floor: 3, capacity: 42, equipment: ['projecteur', 'wifi', 'tableau', 'prises'], isActive: true },
]

function createPerfRooms(): (typeof rooms.$inferInsert)[] {
  return Array.from({ length: 200 }, (_, index) => ({
    name: `PERF-${String(index + 1).padStart(3, '0')}`,
    building: index % 2 === 0 ? 'Bâtiment A' : 'Bâtiment B',
    floor: index % 4,
    capacity: 12 + (index % 189),
    equipment: index % 3 === 0
      ? ['projecteur', 'wifi', 'tableau']
      : index % 3 === 1
        ? ['wifi', 'prises']
        : ['projecteur', 'wifi', 'visioconférence'],
    isActive: true,
  }))
}

async function upsertRooms(roomValues: (typeof rooms.$inferInsert)[]) {
  await db
    .insert(rooms)
    .values(roomValues)
    .onConflictDoUpdate({
      target: [rooms.building, rooms.name],
      set: {
        floor: sql`excluded.floor`,
        capacity: sql`excluded.capacity`,
        equipment: sql`excluded.equipment`,
        isActive: sql`excluded.is_active`,
      },
    })
}

async function seedUsers() {
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
}

async function cleanPerfRooms() {
  const deleted = await db.delete(rooms).where(like(rooms.name, 'PERF-%')).returning({ id: rooms.id })
  console.log(`Removed ${deleted.length} performance rooms.`)
}

try {
  const mode = process.argv[2]
  if (mode === '--clean-perf') {
    await cleanPerfRooms()
  } else if (mode === '--perf') {
    const performanceRooms = createPerfRooms()
    await upsertRooms(performanceRooms)
    console.log(`Seeded ${performanceRooms.length} performance rooms.`)
  } else {
    await seedUsers()
    await upsertRooms(seedRooms)
    console.log(`Seeded ${seedRooms.length} rooms.`)
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Database seed failed: ${message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
