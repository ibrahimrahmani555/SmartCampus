import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { login } from './loginService.js'
import { createSession, findActiveSession } from './sessionRepository.js'

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const SESSION_COOKIE = 'smartcampus_session'
const SESSION_DURATION_SECONDS = 30 * 60

const authRoutes = new Hono()

authRoutes.post('/login', async (c) => {
  const parsed = loginBodySchema.safeParse(await c.req.json().catch(() => undefined))
  if (!parsed.success) {
    return c.json({ message: 'Veuillez saisir un e-mail et un mot de passe valides.' }, 400)
  }

  try {
    const result = await login(parsed.data.email, parsed.data.password)

    if (!result.ok) {
      if (result.reason === 'domain-not-allowed') {
        return c.json({ message: 'Utilisez une adresse e-mail de votre établissement.' }, 403)
      }
      if (result.reason === 'disabled-account') {
        return c.json(
          { message: "Ce compte est désactivé. Veuillez contacter l'administration." },
          403,
        )
      }
      return c.json({ message: 'E-mail ou mot de passe incorrect' }, 401)
    }

    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000)
    const sessionId = await createSession(result.user.id, expiresAt)

    setCookie(c, SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
      expires: expiresAt,
    })

    return c.json({ email: result.user.email, role: result.user.role }, 200)
  } catch {
    return c.json({ message: 'Une erreur est survenue. Veuillez réessayer.' }, 500)
  }
})

authRoutes.get('/me', async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE)
  if (!sessionId || !z.string().uuid().safeParse(sessionId).success) {
    return c.json({ message: 'Session invalide ou expirée.' }, 401)
  }

  try {
    const user = await findActiveSession(sessionId)
    if (!user) {
      return c.json({ message: 'Session invalide ou expirée.' }, 401)
    }

    return c.json({ email: user.email, role: user.role }, 200)
  } catch {
    return c.json({ message: 'Une erreur est survenue. Veuillez réessayer.' }, 500)
  }
})

export default authRoutes
