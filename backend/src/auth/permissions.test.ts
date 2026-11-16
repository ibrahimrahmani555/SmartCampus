import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { can, requirePermission } from './permissions.js'
import type { AuthUser } from './sessionMiddleware.js'

describe('permissions', () => {
  it.each([
    ['student', 'rooms:read', true],
    ['student', 'availability:read', true],
    ['student', 'favorites:manage', true],
    ['student', 'rooms:manage', false],
    ['staff', 'rooms:read', true],
    ['staff', 'availability:read', true],
    ['staff', 'favorites:manage', true],
    ['staff', 'rooms:manage', false],
    ['admin', 'rooms:read', true],
    ['admin', 'availability:read', true],
    ['admin', 'favorites:manage', true],
    ['admin', 'rooms:manage', true],
  ] as const)('%s can %s: %s', (role, permission, expected) => {
    expect(can(role, permission)).toBe(expected)
  })

})

describe('requirePermission', () => {
  function createApp(user?: AuthUser) {
    const app = new Hono<{ Variables: { user: AuthUser } }>()
    if (user) {
      app.use('/protected', async (c, next) => {
        c.set('user', user)
        await next()
      })
    }
    app.post('/protected', requirePermission('rooms:manage'), (c) => c.json({ ok: true }))
    return app
  }

  it('returns 401 without a session', async () => {
    const response = await createApp().request('/protected', { method: 'POST' })
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      code: 'UNAUTHENTICATED',
      message: 'Veuillez vous connecter.',
    })
  })

  it('returns 403 when the session role lacks the permission', async () => {
    const response = await createApp({ id: '1', email: 'student@example.com', role: 'student' }).request('/protected', {
      method: 'POST',
    })
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ code: 'FORBIDDEN', message: 'Accès refusé.' })
  })

  it('passes when the session role has the permission and ignores the request body role', async () => {
    const response = await createApp({ id: '1', email: 'admin@example.com', role: 'admin' }).request('/protected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'student' }),
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })
})
