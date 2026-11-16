import { beforeEach, describe, expect, it, vi } from 'vitest'

const repositoryMocks = vi.hoisted(() => ({
  listActive: vi.fn(),
  findById: vi.fn(),
}))

const sessionMocks = vi.hoisted(() => ({
  findWithUser: vi.fn(),
  extend: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('./roomRepository.js', () => repositoryMocks)
vi.mock('../auth/sessionRepository.js', () => sessionMocks)

import app from '../index.js'
import * as roomService from './roomService.js'

const activeRoom = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Salle active',
  building: 'Bâtiment A',
  floor: 1,
  capacity: 30,
  equipment: ['wifi'],
  imageUrl: null,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
}

const inactiveRoom = {
  ...activeRoom,
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Salle inactive',
  isActive: false,
}

const rooms = [activeRoom, inactiveRoom]

describe('roomService', () => {
  beforeEach(() => {
    repositoryMocks.listActive.mockReset().mockImplementation(async () => rooms.filter((room) => room.isActive))
    repositoryMocks.findById.mockReset().mockImplementation(async (id: string) => rooms.find((room) => room.id === id))
    sessionMocks.findWithUser.mockReset()
    sessionMocks.extend.mockReset().mockResolvedValue(undefined)
    sessionMocks.remove.mockReset().mockResolvedValue(undefined)
  })

  it('returns only active rooms', async () => {
    await expect(roomService.listRooms()).resolves.toEqual([activeRoom])
  })

  it.todo('filters rooms by minimum capacity when SC-21 is implemented')

  it('excludes inactive rooms from the list and lookup by id', async () => {
    await expect(roomService.listRooms()).resolves.not.toContainEqual(inactiveRoom)
    await expect(roomService.getRoom(inactiveRoom.id)).resolves.toBeUndefined()
  })

  it('returns an empty list without throwing', async () => {
    repositoryMocks.listActive.mockResolvedValue([])

    await expect(roomService.listRooms()).resolves.toEqual([])
  })
})

describe('room routes', () => {
  beforeEach(() => {
    repositoryMocks.listActive.mockReset().mockResolvedValue([activeRoom])
    repositoryMocks.findById.mockReset().mockImplementation(async (id: string) => rooms.find((room) => room.id === id))
  })

  it('returns 401 without a session', async () => {
    const response = await app.request('/api/rooms')

    expect(response.status).toBe(401)
  })

  it.each(['student', 'staff', 'admin'] as const)('returns rooms for %s', async (role) => {
    sessionMocks.findWithUser.mockResolvedValue({
      session: { id: `session-${role}`, expiresAt: new Date(Date.now() + 60_000) },
      user: { id: `${role}-1`, email: `${role}@campus.test`, role, status: 'active' },
    })

    const response = await app.request('/api/rooms', {
      headers: { cookie: `smartcampus_session=session-${role}` },
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual([
      {
        id: activeRoom.id,
        name: activeRoom.name,
        building: activeRoom.building,
        floor: activeRoom.floor,
        capacity: activeRoom.capacity,
        equipment: activeRoom.equipment,
        image_url: activeRoom.imageUrl,
      },
    ])
    expect(JSON.stringify(body)).not.toContain('is_active')
    expect(JSON.stringify(body)).not.toContain('created_at')
  })

  it('returns 400 for an invalid room id', async () => {
    sessionMocks.findWithUser.mockResolvedValue({
      session: { id: 'session-valid', expiresAt: new Date(Date.now() + 60_000) },
      user: { id: 'student-1', email: 'student@campus.test', role: 'student', status: 'active' },
    })

    const response = await app.request('/api/rooms/not-a-uuid', {
      headers: { cookie: 'smartcampus_session=session-valid' },
    })

    expect(response.status).toBe(400)
  })

  it('returns 404 for an unknown room id', async () => {
    sessionMocks.findWithUser.mockResolvedValue({
      session: { id: 'session-valid', expiresAt: new Date(Date.now() + 60_000) },
      user: { id: 'student-1', email: 'student@campus.test', role: 'student', status: 'active' },
    })

    const response = await app.request('/api/rooms/33333333-3333-4333-8333-333333333333', {
      headers: { cookie: 'smartcampus_session=session-valid' },
    })

    expect(response.status).toBe(404)
  })
})
