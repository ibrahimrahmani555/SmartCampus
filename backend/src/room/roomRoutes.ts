import { Hono } from 'hono'
import { z } from 'zod'
import { requirePermission } from '../auth/permissions.js'
import { requireSession } from '../auth/sessionMiddleware.js'
import * as roomService from './roomService.js'

const roomIdSchema = z.uuid()

function toRoomResponse(room: {
  id: string
  name: string
  building: string
  floor: number | null
  capacity: number
  equipment: string[]
  imageUrl: string | null
}) {
  return {
    id: room.id,
    name: room.name,
    building: room.building,
    floor: room.floor,
    capacity: room.capacity,
    equipment: room.equipment,
    image_url: room.imageUrl,
  }
}

export const roomRoutes = new Hono()

roomRoutes.use('*', requireSession, requirePermission('rooms:read'))

roomRoutes.get('/', async (c) => {
  const rooms = await roomService.listRooms()
  return c.json(rooms.map(toRoomResponse))
})

roomRoutes.get('/:id', async (c) => {
  const parsedId = roomIdSchema.safeParse(c.req.param('id'))
  if (!parsedId.success) return c.json({ message: 'Identifiant de salle invalide.' }, 400)

  const room = await roomService.getRoom(parsedId.data)
  if (!room) return c.json({ message: 'Salle introuvable.' }, 404)

  return c.json(toRoomResponse(room))
})
