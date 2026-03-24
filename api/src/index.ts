import cors from 'cors'
import express from 'express'
import { Pool } from 'pg'
import { randomUUID } from 'crypto'

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
app.use(express.json({ limit: '6mb' }))

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

async function ensureTables() {
  await pool.query(`
    create table if not exists achievements (
      id text primary key,
      title text not null,
      description text not null,
      category text not null,
      collection text not null,
      color text not null,
      icon text not null,
      image_url text,
      image_mime text,
      image_data bytea,
      active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `)

  // Backward-compatible migrations (no-op if columns already exist)
  await pool.query('alter table achievements add column if not exists image_mime text')
  await pool.query('alter table achievements add column if not exists image_data bytea')

  // Seed initial catalog if empty
  const existing = await pool.query('select count(1)::int as count from achievements')
  const count = Number(existing.rows?.[0]?.count ?? 0)
  if (count > 0) return

  const seed = [
    {
      id: 'a-1',
      title: 'Leitura Genesis',
      description: 'Concluiu a leitura de Genesis.',
      category: 'Leitura',
      collection: 'Velho Testamento',
      color: 'clay',
      icon: 'GN',
      image_url: null,
      active: true,
    },
    {
      id: 'a-2',
      title: 'Leitura Exodo',
      description: 'Concluiu a leitura de Exodo.',
      category: 'Leitura',
      collection: 'Velho Testamento',
      color: 'clay',
      icon: 'EX',
      image_url: null,
      active: true,
    },
    {
      id: 'a-3',
      title: 'Presenca Perfeita',
      description: '100 por cento de presenca no mes.',
      category: 'Frequencia',
      collection: 'Presenca',
      color: 'teal',
      icon: 'PR',
      image_url: null,
      active: true,
    },
    {
      id: 'a-4',
      title: 'Memorizacao 1',
      description: 'Concluiu desafio de memorizacao.',
      category: 'Memorizacao',
      collection: 'Desafios',
      color: 'gold',
      icon: 'MM',
      image_url: null,
      active: true,
    },
    {
      id: 'a-5',
      title: 'Pentateuco Completo',
      description: 'Completou todo o bloco do Pentateuco.',
      category: 'Modulo',
      collection: 'Velho Testamento',
      color: 'navy',
      icon: 'PT',
      image_url: null,
      active: true,
    },
    {
      id: 'a-6',
      title: 'Convidou um amigo(a)',
      description: 'Convidou um amigo(a) para o seminario.',
      category: 'Participacao',
      collection: 'Seminario',
      color: 'rose',
      icon: 'AM',
      image_url: '/achievements/convidou-amigo-seminario.jpg',
      active: true,
    },
  ]

  for (const a of seed) {
    await pool.query(
      `insert into achievements (id, title, description, category, collection, color, icon, image_url, active)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (id) do nothing`,
      [a.id, a.title, a.description, a.category, a.collection, a.color, a.icon, a.image_url, a.active],
    )
  }
}

function parseImageDataUrl(value: unknown, maxBytes = 2_000_000): { mime: string; bytes: Buffer } | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  if (!trimmed.startsWith('data:') || !trimmed.includes(';base64,')) {
    return null
  }

  const commaIdx = trimmed.indexOf(',')
  const header = trimmed.slice(5, commaIdx)
  const base64 = trimmed.slice(commaIdx + 1)

  const mime = header.replace(/;base64$/i, '').trim()
  if (!mime || !mime.includes('/')) return null

  let bytes: Buffer
  try {
    bytes = Buffer.from(base64, 'base64')
  } catch {
    return null
  }

  if (bytes.length === 0) return null
  if (bytes.length > maxBytes) return null
  return { mime, bytes }
}

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

app.get('/api/achievements', async (_req, res) => {
  try {
    const result = await pool.query(
      'select id, title, description, category, collection, color, icon, image_url, (image_data is not null) as has_image, active from achievements order by created_at asc',
    )
    res.status(200).json({ achievements: result.rows })
  } catch {
    res.status(500).json({ error: 'Failed to list achievements' })
  }
})

app.get('/api/achievements/:id/image', async (req, res) => {
  const id = String(req.params.id)
  try {
    const result = await pool.query('select image_mime, image_data from achievements where id=$1', [id])
    const row = result.rows?.[0]
    if (!row?.image_data) {
      res.status(404).send('Not found')
      return
    }

    res.setHeader('Content-Type', row.image_mime || 'application/octet-stream')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(200).send(row.image_data)
  } catch {
    res.status(500).send('Failed')
  }
})

app.post('/api/achievements', async (req, res) => {
  const title = String(req.body?.title ?? '').trim()
  const description = String(req.body?.description ?? '').trim()
  const category = String(req.body?.category ?? '').trim()
  const collection = String(req.body?.collection ?? '').trim()
  const color = String(req.body?.color ?? '').trim()
  const icon = String(req.body?.icon ?? '').trim()
  const imageUrlRaw = req.body?.imageUrl ?? req.body?.image_url
  const imageUrl = imageUrlRaw ? String(imageUrlRaw).trim() : null
  const imageDataUrl = req.body?.imageDataUrl ?? req.body?.image_data_url
  const active = typeof req.body?.active === 'boolean' ? (req.body.active as boolean) : true

  if (!title || !description || !category || !collection || !color || !icon) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  const id = randomUUID()

  const hasImageDataUrl =
    Object.prototype.hasOwnProperty.call(req.body ?? {}, 'imageDataUrl') ||
    Object.prototype.hasOwnProperty.call(req.body ?? {}, 'image_data_url')

  const imageBlob = parseImageDataUrl(imageDataUrl)
  if (hasImageDataUrl && imageDataUrl != null && !imageBlob) {
    res.status(400).json({ error: 'Invalid imageDataUrl' })
    return
  }

  try {
    const result = await pool.query(
      `insert into achievements (id, title, description, category, collection, color, icon, image_url, image_mime, image_data, active)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       returning id, title, description, category, collection, color, icon, image_url, (image_data is not null) as has_image, active`,
      [id, title, description, category, collection, color, icon, imageUrl, imageBlob?.mime ?? null, imageBlob?.bytes ?? null, active],
    )
    res.status(201).json({ achievement: result.rows[0] })
  } catch {
    res.status(500).json({ error: 'Failed to create achievement' })
  }
})

app.put('/api/achievements/:id', async (req, res) => {
  const id = String(req.params.id)
  const title = String(req.body?.title ?? '').trim()
  const description = String(req.body?.description ?? '').trim()
  const category = String(req.body?.category ?? '').trim()
  const collection = String(req.body?.collection ?? '').trim()
  const color = String(req.body?.color ?? '').trim()
  const icon = String(req.body?.icon ?? '').trim()
  const imageUrlRaw = req.body?.imageUrl ?? req.body?.image_url
  const imageUrl = imageUrlRaw ? String(imageUrlRaw).trim() : null
  const imageDataUrl = req.body?.imageDataUrl ?? req.body?.image_data_url
  const active = typeof req.body?.active === 'boolean' ? (req.body.active as boolean) : true

  if (!title || !description || !category || !collection || !color || !icon) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  const hasImageDataUrl =
    Object.prototype.hasOwnProperty.call(req.body ?? {}, 'imageDataUrl') ||
    Object.prototype.hasOwnProperty.call(req.body ?? {}, 'image_data_url')

  const imageBlob = parseImageDataUrl(imageDataUrl)
  if (hasImageDataUrl && imageDataUrl != null && !imageBlob) {
    res.status(400).json({ error: 'Invalid imageDataUrl' })
    return
  }

  try {
    const result = hasImageDataUrl
      ? await pool.query(
          `update achievements
           set title=$2,
               description=$3,
               category=$4,
               collection=$5,
               color=$6,
               icon=$7,
               image_url=$8,
               image_mime=$9,
               image_data=$10,
               active=$11,
               updated_at=now()
           where id=$1
           returning id, title, description, category, collection, color, icon, image_url, (image_data is not null) as has_image, active`,
          [id, title, description, category, collection, color, icon, imageUrl, imageBlob?.mime ?? null, imageBlob?.bytes ?? null, active],
        )
      : await pool.query(
          `update achievements
           set title=$2,
               description=$3,
               category=$4,
               collection=$5,
               color=$6,
               icon=$7,
               image_url=$8,
               active=$9,
               updated_at=now()
           where id=$1
           returning id, title, description, category, collection, color, icon, image_url, (image_data is not null) as has_image, active`,
          [id, title, description, category, collection, color, icon, imageUrl, active],
        )

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    res.status(200).json({ achievement: result.rows[0] })
  } catch {
    res.status(500).json({ error: 'Failed to update achievement' })
  }
})

app.get('/db', async (_req, res) => {
  try {
    const result = await pool.query('select now() as now')
    res.status(200).json({ ok: true, now: result.rows?.[0]?.now ?? null })
  } catch (err) {
    res.status(500).json({ ok: false })
  }
})

ensureTables()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on :${PORT}`)
    })
  })
  .catch(() => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize DB schema')
    process.exit(1)
  })
