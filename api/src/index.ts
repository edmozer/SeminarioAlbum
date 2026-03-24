import cors from 'cors'
import express from 'express'
import { Pool } from 'pg'

function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN)

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

type ApiRole = 'superadmin' | 'director' | 'professor' | 'student'

const SEED_USERS: Array<{ id: string; email: string; displayName: string; role: ApiRole }> = [
  { id: 'u-admin', email: 'admin@seminario.com', displayName: 'Admin Sistema', role: 'superadmin' },
  { id: 'u-director-1', email: 'director@seminario.com', displayName: 'Dir Roberto Alves', role: 'director' },
  { id: 'u-teacher-1', email: 'professor@seminario.com', displayName: 'Prof Ana Silva', role: 'professor' },
  { id: 'u-teacher-2', email: 'carlos@seminario.com', displayName: 'Prof Carlos Souza', role: 'professor' },
  { id: 's-1', email: 'student@seminario.com', displayName: 'Julia Martins', role: 'student' },
]

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      if (allowedOrigins.length === 0) {
        // Safe defaults for local dev; set CORS_ORIGIN in Render.
        if (origin === 'http://localhost:5173' || origin === 'http://localhost:4173') {
          return cb(null, true)
        }
        return cb(new Error('CORS blocked: set CORS_ORIGIN'))
      }
      if (allowedOrigins.includes(origin)) return cb(null, true)
      return cb(new Error('CORS blocked'))
    },
    credentials: true
  })
)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
})

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true })
})

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true })
})

app.post('/api/login', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Invalid input' })
    return
  }

  const user = SEED_USERS.find((u) => u.email === email)
  if (!user) {
    res.status(401).json({ error: 'User not found' })
    return
  }

  res.status(200).json({
    token: `jwt-token-${user.id}`,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  })
})

app.get('/db', async (_req, res) => {
  try {
    const result = await pool.query('select now() as now')
    res.status(200).json({ ok: true, now: result.rows?.[0]?.now ?? null })
  } catch (err) {
    res.status(500).json({ ok: false })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on :${PORT}`)
})
