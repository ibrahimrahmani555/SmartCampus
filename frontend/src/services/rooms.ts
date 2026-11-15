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

export class RoomsRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'RoomsRequestError'
  }
}

export async function listRooms(): Promise<Room[]> {
  const response = await fetch('/api/rooms', { credentials: 'include' })

  if (response.status === 401) {
    throw new RoomsRequestError(roomsText.unauthenticated, response.status)
  }
  if (response.status === 403) {
    throw new RoomsRequestError(roomsText.forbidden, response.status)
  }
  if (!response.ok) {
    throw new RoomsRequestError(roomsText.error, response.status)
  }

  return (await response.json()) as Room[]
}
