import * as roomRepository from './roomRepository.js'
import {
  emptyClosureReader,
  emptyOccupancyReader,
  type ClosureReader,
  type OccupancyReader,
} from './availabilityReaders.js'

export const CAMPUS_TIMEZONE = 'Africa/Casablanca'

export type RoomAvailabilityStatus = 'free' | 'occupied' | 'closed'

export interface ActiveRoomReader {
  listActive(): Promise<Array<{ id: string; isActive: boolean }>>
}

export interface RoomAvailabilityDependencies {
  occupancyReader?: OccupancyReader
  closureReader?: ClosureReader
  roomReader?: ActiveRoomReader
}

function campusDateTimeToUtc(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMPUS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(utcGuess))
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  const campusAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
  )
  return new Date(utcGuess - (campusAsUtc - utcGuess))
}

export function createRoomAvailabilityService({
  occupancyReader = emptyOccupancyReader,
  closureReader = emptyClosureReader,
  roomReader = roomRepository,
}: RoomAvailabilityDependencies = {}) {
  return {
    async availability(date: string, start: string, end: string) {
      const from = campusDateTimeToUtc(date, start)
      const to = campusDateTimeToUtc(date, end)
      const rooms = await roomReader.listActive()
      const roomIds = rooms.filter((room) => room.isActive).map((room) => room.id)
      const [reservations, closures] = await Promise.all([
        occupancyReader.findApprovedOverlapping(roomIds, from, to),
        closureReader.findClosuresOverlapping(roomIds, from, to),
      ])
      const occupiedRoomIds = new Set(reservations.map((reservation) => reservation.roomId))
      const closedRoomIds = new Set(closures.map((closure) => closure.roomId))

      return rooms
        .filter((room) => room.isActive)
        .map((room) => ({
          roomId: room.id,
          status: closedRoomIds.has(room.id)
            ? 'closed' as const
            : occupiedRoomIds.has(room.id)
              ? 'occupied' as const
              : 'free' as const,
        }))
    },
  }
}

export const roomAvailabilityService = createRoomAvailabilityService()
