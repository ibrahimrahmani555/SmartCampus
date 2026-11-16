import * as roomRepository from './roomRepository.js'
import type { RoomFilters } from './roomRepository.js'

export async function listRooms(filters: RoomFilters = {}) {
  return roomRepository.listActive(filters)
}

export async function getRoom(id: string) {
  const room = await roomRepository.findById(id)
  return room?.isActive ? room : undefined
}
