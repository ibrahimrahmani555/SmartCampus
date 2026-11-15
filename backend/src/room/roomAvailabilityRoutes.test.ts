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
const availabilityMocks = vi.hoisted(() => ({
  availability: vi.fn(),
}))

vi.mock('./roomRepository.js', () => repositoryMocks)
vi.mock('../auth/sessionRepository.js', () => sessionMocks)
vi.mock('./roomAvailabilityService.js', () => ({
  roomAvailabilityService: availabilityMocks,
}))

import app from '../index.js'

describe('GET /api/rooms/availability', () => {
  beforeEach(() => {
    repositoryMocks.listActive.mockReset().mockResolvedValue([])
    repositoryMocks.findById.mockReset()
    availabilityMocks.availability.mockReset().mockResolvedValue([])
    sessionMocks.findWithUser.mockReset()
    sessionMocks.extend.mockReset().mockResolvedValue(undefined)
  })

  it('returns 400 when the end time is not after the start time', async () => {
    sessionMocks.findWithUser.mockResolvedValue({
      session: { id: 'session-1', expiresAt: new Date(Date.now() + 60_000) },
      user: { id: 'student-1', email: 'student@campus.test', role: 'student', status: 'active' },
    })

    const response = await app.request('/api/rooms/availability?date=2026-11-15&start=11:00&end=10:00', {
      headers: { cookie: 'smartcampus_session=session-1' },
    })

    expect(response.status).toBe(400)
  })

  it('returns 401 for a visitor', async () => {
    const response = await app.request('/api/rooms/availability?date=2026-11-15&start=10:00&end=11:00')

    expect(response.status).toBe(401)
  })
})
