import { and, arrayContains, eq, gte, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { rooms } from '../db/schema.js'

export type RoomFilters = {
  building?: string
  minCapacity?: number
  equipment?: string[]
}

export async function listActive(filters: RoomFilters = {}) {
  const conditions = [eq(rooms.isActive, true)]

  if (filters.building) {
    conditions.push(sql`lower(${rooms.building}) = ${filters.building.trim().toLowerCase()}`)
  }
  if (filters.minCapacity !== undefined) {
    conditions.push(gte(rooms.capacity, filters.minCapacity))
  }
  if (filters.equipment?.length) {
    conditions.push(arrayContains(rooms.equipment, filters.equipment))
  }

  return db
    .select()
    .from(rooms)
    .where(and(...conditions))
}

export async function findById(id: string) {
  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, id), eq(rooms.isActive, true)))
    .limit(1)
  return room
}
