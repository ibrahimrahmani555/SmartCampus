import { roomsText } from '../constants/rooms'

export interface Room {
  id: string
  name: string
  building: string
  floor: number | null
  capacity: number
  equipment: string[]
  image_url: string | null
}

export interface RoomFilters {
  building?: string
  minCapacity?: number
  equipment?: string[]
}

export type RoomAvailabilityStatus = 'free' | 'occupied' | 'closed'

export interface RoomAvailability extends Room {
  status: RoomAvailabilityStatus
}

export interface RoomCalendarSlot {
  start: string
  end: string
  status: RoomAvailabilityStatus
}

export interface RoomCalendarDay {
  date: string
  slots: RoomCalendarSlot[]
}

export interface RoomCalendar {
  roomId: string
  weekStart: string
  days: RoomCalendarDay[]
}

export class RoomsRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'RoomsRequestError'
  }
}

export async function listRooms(filters: RoomFilters = {}): Promise<Room[]> {
  const params = new URLSearchParams()
  if (filters.building) params.set('building', filters.building)
  if (filters.minCapacity !== undefined) params.set('minCapacity', String(filters.minCapacity))
  for (const equipment of filters.equipment ?? []) params.append('equipment', equipment)

  const query = params.toString()
  const response = await fetch(`/api/rooms${query ? `?${query}` : ''}`, { credentials: 'include' })

  if (response.status === 401) {
    throw new RoomsRequestError(roomsText.unauthenticated, response.status)
  }
  if (response.status === 403) {
    throw new RoomsRequestError(roomsText.forbidden, response.status)
  }
  if (response.status === 400) {
    const data = (await response.json()) as { message?: string }
    throw new RoomsRequestError(data.message ?? roomsText.error, response.status)
  }
  if (!response.ok) {
    throw new RoomsRequestError(roomsText.error, response.status)
  }

  return (await response.json()) as Room[]
}

export async function getRoomAvailability(date: string, start: string, end: string): Promise<RoomAvailability[]> {
  const params = new URLSearchParams({ date, start, end })
  const response = await fetch(`/api/rooms/availability?${params.toString()}`, { credentials: 'include' })

  if (response.status === 401) {
    throw new RoomsRequestError(roomsText.unauthenticated, response.status)
  }
  if (response.status === 403) {
    throw new RoomsRequestError(roomsText.forbidden, response.status)
  }
  if (response.status === 400) {
    const data = (await response.json()) as { message?: string }
    throw new RoomsRequestError(data.message ?? roomsText.error, response.status)
  }
  if (!response.ok) {
    throw new RoomsRequestError(roomsText.error, response.status)
  }

  return (await response.json()) as RoomAvailability[]
}

export async function getRoomCalendar(roomId: string, weekStart: string): Promise<RoomCalendar> {
  const params = new URLSearchParams({ weekStart })
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/calendar?${params.toString()}`, {
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new RoomsRequestError(roomsText.unauthenticated, response.status)
  }
  if (response.status === 403) {
    throw new RoomsRequestError(roomsText.forbidden, response.status)
  }
  if (response.status === 400 || response.status === 404) {
    const data = (await response.json()) as { message?: string }
    throw new RoomsRequestError(data.message ?? roomsText.error, response.status)
  }
  if (!response.ok) {
    throw new RoomsRequestError(roomsText.error, response.status)
  }

  return (await response.json()) as RoomCalendar
}
