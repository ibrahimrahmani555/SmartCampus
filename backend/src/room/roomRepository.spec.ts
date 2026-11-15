import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/index.js'
import { rooms } from '../db/schema.js'
import * as roomRepository from './roomRepository.js'

describe('roomRepository active rooms', () => {
  const building = `SC25-${randomUUID()}`
  let activeRoomId: string
  let inactiveRoomId: string

  beforeEach(async () => {
    const [activeRoom, inactiveRoom] = await db
      .insert(rooms)
      .values([
        {
          name: 'Active',
          building,
          capacity: 20,
          equipment: [],
          isActive: true,
        },
        {
          name: 'Inactive',
          building,
          capacity: 20,
          equipment: [],
          isActive: false,
        },
      ])
      .returning({ id: rooms.id })

    activeRoomId = activeRoom.id
    inactiveRoomId = inactiveRoom.id
  })

  afterEach(async () => {
    await db.delete(rooms).where(inArray(rooms.id, [activeRoomId, inactiveRoomId]))
  })

  it('lists only active rooms and does not find an inactive room by id', async () => {
    const listedRooms = await roomRepository.listActive()
    const testRooms = listedRooms.filter((room) => room.building === building)

    expect(testRooms.map((room) => room.name)).toEqual(['Active'])
    expect(await roomRepository.findById(activeRoomId)).toMatchObject({ id: activeRoomId })
    expect(await roomRepository.findById(inactiveRoomId)).toBeUndefined()
  })
})
