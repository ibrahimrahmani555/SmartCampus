import * as roomRepository from './roomRepository.js'

export async function listRooms() {
  return roomRepository.listActive()
}

export async function getRoom(id: string) {
  const room = await roomRepository.findById(id)
  return room?.isActive ? room : undefined
}
