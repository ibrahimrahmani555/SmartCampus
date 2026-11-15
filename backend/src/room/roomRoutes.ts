import { Hono } from 'hono'
import { z } from 'zod'
import { requirePermission } from '../auth/permissions.js'
import { requireSession } from '../auth/sessionMiddleware.js'
import { roomAvailabilityService } from './roomAvailabilityService.js'
import * as roomService from './roomService.js'

const roomIdSchema = z.uuid()
const isValidDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}
const availabilityQuerySchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La date doit respecter le format YYYY-MM-DD.')
    .refine(isValidDate, 'La date est invalide.'),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'L’heure de début doit respecter le format HH:mm.'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'L’heure de fin doit respecter le format HH:mm.'),
}).superRefine((value, context) => {
  const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  if (toMinutes(value.start) >= 24 * 60 || toMinutes(value.end) >= 24 * 60) {
    context.addIssue({ code: 'custom', path: ['start'], message: 'Les heures doivent être comprises entre 00:00 et 23:59.' })
  } else if (toMinutes(value.end) <= toMinutes(value.start)) {
    context.addIssue({ code: 'custom', path: ['end'], message: 'L’heure de fin doit être postérieure à l’heure de début.' })
  }
})
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

roomRoutes.use('*', requireSession)

roomRoutes.get('/', requirePermission('rooms:read'), async (c) => {
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

roomRoutes.get('/availability', requirePermission('availability:read'), async (c) => {
  const parsedQuery = availabilityQuerySchema.safeParse({
    date: c.req.query('date'),
    start: c.req.query('start'),
    end: c.req.query('end'),
  })
  if (!parsedQuery.success) {
    return c.json({ message: parsedQuery.error.issues[0]?.message ?? 'Paramètres de disponibilité invalides.' }, 400)
  }

  const availability = await roomAvailabilityService.availability(
    parsedQuery.data.date,
    parsedQuery.data.start,
    parsedQuery.data.end,
  )
  const rooms = await roomService.listRooms()
  const statusByRoomId = new Map(availability.map(({ roomId, status }) => [roomId, status]))
  return c.json(
    rooms.map((room) => ({
      ...toRoomResponse(room),
      status: statusByRoomId.get(room.id) ?? 'free',
    })),
  )
})

roomRoutes.get('/:id', requirePermission('rooms:read'), async (c) => {
  const parsedId = roomIdSchema.safeParse(c.req.param('id'))
  if (!parsedId.success) return c.json({ message: 'Identifiant de salle invalide.' }, 400)

  const room = await roomService.getRoom(parsedId.data)
  if (!room) return c.json({ message: 'Salle introuvable.' }, 404)

  return c.json(toRoomResponse(room))
})
