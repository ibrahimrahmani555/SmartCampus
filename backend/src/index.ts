import 'dotenv/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { login } from './auth/loginService.js'
import * as sessionRepository from './auth/sessionRepository.js'

const app = new Hono()
const loginBodySchema = z.object({ email: z.email(), password: z.string().min(1) })
const sessionCookie = 'smartcampus_session'

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' })
})

app.post('/api/auth/login', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ message: 'Données de connexion invalides.' }, 400)
  }

  const parsed = loginBodySchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ message: 'Veuillez saisir une adresse e-mail et un mot de passe valides.' }, 400)
  }

  try {
    const result = await login(parsed.data.email, parsed.data.password)
    if (!result.success) {
      if (result.reason === 'disabled_account') {
        return c.json({ message: 'Ce compte est désactivé. Veuillez contacter l’administration.' }, 403)
      }
      if (result.reason === 'unauthorized_domain') {
        return c.json({ message: 'Veuillez utiliser une adresse e-mail de votre établissement.' }, 401)
      }
      return c.json({ message: 'E-mail ou mot de passe incorrect.' }, 401)
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
    const session = await sessionRepository.create(result.user.id, expiresAt)
    setCookie(c, sessionCookie, session.id, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    })
    return c.json({ email: result.user.email, role: result.user.role }, 200)
  } catch {
    return c.json({ message: 'La connexion est momentanément indisponible.' }, 500)
  }
})

app.get('/api/auth/me', async (c) => {
  const sessionId = getCookie(c, sessionCookie)
  if (!sessionId) return c.json({ message: 'Authentification requise.' }, 401)

  try {
    const result = await sessionRepository.findActiveWithUser(sessionId)
    if (!result) {
      deleteCookie(c, sessionCookie, { path: '/' })
      return c.json({ message: 'Authentification requise.' }, 401)
    }
    return c.json({ email: result.user.email, role: result.user.role })
  } catch {
    return c.json({ message: 'Authentification requise.' }, 401)
  }
})

const port = Number(process.env.PORT ?? 3000)
const currentFile = fileURLToPath(import.meta.url)
const entryFile = process.argv[1] ? resolve(process.argv[1]) : ''
const isMain = entryFile === currentFile

if (isMain) {
  serve(
    {
      fetch: app.fetch,
      port,
    },
    () => {
      console.log(`Backend listening on http://localhost:${port}`)
    },
  )
}

export default app
