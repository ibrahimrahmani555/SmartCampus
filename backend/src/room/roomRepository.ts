import { and, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { rooms } from '../db/schema.js'

export async function listActive() {
  return db
    .select()
    .from(rooms)
    .where(eq(rooms.isActive, true))
}

export async function findById(id: string) {
  const [room] = await db.select().from(rooms).where(and(eq(rooms.id, id))).limit(1)
  return room
}
