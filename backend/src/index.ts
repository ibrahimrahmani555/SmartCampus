import 'dotenv/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import authRoutes from './auth/routes.js'

const app = new Hono()

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' })
})

app.route('/api/auth', authRoutes)

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
