import { Hono } from 'hono'
import { z } from 'zod'
import { requirePermission } from '../auth/permissions.js'
import { requireSession } from '../auth/sessionMiddleware.js'
import * as roomService from './roomService.js'

const roomIdSchema = z.uuid()
const roomFiltersSchema = z.object({
  building: z.string().optional(),
  minCapacity: z.string()
    .regex(/^\d+$/, 'minCapacity doit être un entier supérieur ou égal à 1.')
    .transform(Number)
    .refine((value) => value >= 1, 'minCapacity doit être un entier supérieur ou égal à 1.')
    .optional(),
  equipment: z.array(z.string().min(1)).default([]),
})

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
  const parsedFilters = roomFiltersSchema.safeParse({
    building: c.req.query('building')?.trim() || undefined,
    minCapacity: c.req.query('minCapacity')?.trim() || undefined,
    equipment: (c.req.queries('equipment') ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean),
  })
  if (!parsedFilters.success) {
    return c.json({ message: parsedFilters.error.issues[0]?.message ?? 'Filtres invalides.' }, 400)
  }

  const rooms = await roomService.listRooms(parsedFilters.data)
  return c.json(rooms.map(toRoomResponse))
})

roomRoutes.get('/:id', async (c) => {
  const parsedId = roomIdSchema.safeParse(c.req.param('id'))
  if (!parsedId.success) return c.json({ message: 'Identifiant de salle invalide.' }, 400)

  const room = await roomService.getRoom(parsedId.data)
  if (!room) return c.json({ message: 'Salle introuvable.' }, 404)

  return c.json(toRoomResponse(room))
})
