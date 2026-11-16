import type { MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import * as sessionRepository from './sessionRepository.js'

export const sessionCookie = 'smartcampus_session'
export type AuthUser = { id: string; email: string; role: 'student' | 'staff' | 'admin' }

export const requireSession: MiddlewareHandler<{
  Variables: { user: AuthUser }
}> = async (c, next) => {
  c.header('Cache-Control', 'no-store')
  const sessionId = getCookie(c, sessionCookie)
  if (!sessionId) return c.json({ message: 'Authentification requise.' }, 401)

  try {
    const result = await sessionRepository.findWithUser(sessionId)
    if (!result || result.session.expiresAt <= new Date() || result.user.status !== 'active') {
      await sessionRepository.remove(sessionId)
      deleteCookie(c, sessionCookie, { path: '/' })
      return c.json({ message: 'Authentification requise.' }, 401)
    }

    const timeoutMinutes = Number(process.env.SESSION_TIMEOUT_MINUTES ?? 30)
    const expiresAt = new Date(Date.now() + (Number.isFinite(timeoutMinutes) && timeoutMinutes > 0 ? timeoutMinutes : 30) * 60_000)
    await sessionRepository.extend(sessionId, expiresAt)
    setCookie(c, sessionCookie, sessionId, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    })
    c.set('user', { id: result.user.id, email: result.user.email, role: result.user.role })
    await next()
  } catch {
    deleteCookie(c, sessionCookie, { path: '/' })
    return c.json({ message: 'Authentification requise.' }, 401)
  }
}
