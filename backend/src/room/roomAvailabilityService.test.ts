import { describe, expect, it, vi } from 'vitest'
import { createRoomAvailabilityService } from './roomAvailabilityService.js'

const activeRoom = { id: 'room-active', isActive: true }
const closedRoom = { id: 'room-closed', isActive: true }

function createService({
  reservations = [],
  closures = [],
}: {
  reservations?: Array<{ roomId: string; from: Date; to: Date }>
  closures?: Array<{ roomId: string; from: Date; to: Date }>
} = {}) {
  return createRoomAvailabilityService({
    roomReader: {
      listActive: vi.fn().mockResolvedValue([activeRoom, closedRoom]),
    },
    occupancyReader: {
      findApprovedOverlapping: vi.fn().mockImplementation(async (_roomIds, from: Date, to: Date) => (
        reservations.filter((reservation) => reservation.from < to && reservation.to > from)
      )),
    },
    closureReader: {
      findClosuresOverlapping: vi.fn().mockResolvedValue(closures),
    },
  })
}

describe('room availability service', () => {
  const date = '2026-11-15'
  const start = '10:00'
  const end = '11:00'

  it('marks every active room free when there are no reservations', async () => {
    const result = await createService().availability(date, start, end)

    expect(result).toEqual([
      { roomId: activeRoom.id, status: 'free' },
      { roomId: closedRoom.id, status: 'free' },
    ])
  })

  it('marks a room occupied when an approved reservation covers the slot', async () => {
    const result = await createService({
      reservations: [{ roomId: activeRoom.id, from: new Date('2026-11-15T09:00:00Z'), to: new Date('2026-11-15T12:00:00Z') }],
    }).availability(date, start, end)

    expect(result.find((room) => room.roomId === activeRoom.id)?.status).toBe('occupied')
  })

  it('marks a room occupied when an approved reservation covers part of the slot', async () => {
    const result = await createService({
      reservations: [{ roomId: activeRoom.id, from: new Date('2026-11-15T10:30:00Z'), to: new Date('2026-11-15T12:00:00Z') }],
    }).availability(date, start, end)

    expect(result.find((room) => room.roomId === activeRoom.id)?.status).toBe('occupied')
  })

  it('keeps a room free when a reservation ends at the slot start', async () => {
    const result = await createService({
      reservations: [{ roomId: activeRoom.id, from: new Date('2026-11-15T08:00:00Z'), to: new Date('2026-11-15T09:00:00Z') }],
    }).availability(date, start, end)

    expect(result.find((room) => room.roomId === activeRoom.id)?.status).toBe('free')
  })

  it('marks a room closed when a closure overlaps the slot', async () => {
    const result = await createService({
      closures: [{ roomId: closedRoom.id, from: new Date('2026-11-15T09:00:00Z'), to: new Date('2026-11-15T12:00:00Z') }],
    }).availability(date, start, end)

    expect(result.find((room) => room.roomId === closedRoom.id)?.status).toBe('closed')
  })
})
