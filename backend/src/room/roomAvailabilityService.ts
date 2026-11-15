import * as roomRepository from './roomRepository.js'
import {
  emptyClosureReader,
  emptyOccupancyReader,
  type ClosureReader,
  type OccupancyReader,
} from './availabilityReaders.js'

export const CAMPUS_TIMEZONE = 'Africa/Casablanca'
export const CALENDAR_START_HOUR = 8
export const CALENDAR_END_HOUR = 20

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

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function overlaps(from: Date, to: Date, otherFrom: Date, otherTo: Date) {
  return otherFrom < to && otherTo > from
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
    async calendar(roomId: string, weekStart: string) {
      const rooms = await roomReader.listActive()
      const room = rooms.find((candidate) => candidate.id === roomId && candidate.isActive)
      if (!room) return undefined

      const weekEnd = addDays(weekStart, 7)
      const from = campusDateTimeToUtc(weekStart, `${String(CALENDAR_START_HOUR).padStart(2, '0')}:00`)
      const to = campusDateTimeToUtc(weekEnd, `${String(CALENDAR_END_HOUR).padStart(2, '0')}:00`)
      const [reservations, closures] = await Promise.all([
        occupancyReader.findApprovedOverlapping([roomId], from, to),
        closureReader.findClosuresOverlapping([roomId], from, to),
      ])

      return {
        roomId,
        weekStart,
        days: Array.from({ length: 7 }, (_, dayIndex) => {
          const date = addDays(weekStart, dayIndex)
          const slots = Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR }, (_, slotIndex) => {
            const startHour = CALENDAR_START_HOUR + slotIndex
            const start = `${String(startHour).padStart(2, '0')}:00`
            const end = `${String(startHour + 1).padStart(2, '0')}:00`
            const slotFrom = campusDateTimeToUtc(date, start)
            const slotTo = campusDateTimeToUtc(date, end)
            const status = closures.some((closure) => overlaps(slotFrom, slotTo, closure.from, closure.to))
              ? 'closed' as const
              : reservations.some((reservation) => overlaps(slotFrom, slotTo, reservation.from, reservation.to))
                ? 'occupied' as const
                : 'free' as const

            return { start, end, status }
          })
          return { date, slots }
        }),
      }
    },
  }
}

export const roomAvailabilityService = createRoomAvailabilityService()
