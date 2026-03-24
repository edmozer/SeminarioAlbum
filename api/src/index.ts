import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import cors from 'cors'
import express, { type Request, type Response } from 'express'
import { Pool, type PoolClient } from 'pg'

type ApiRole = 'superadmin' | 'director' | 'professor' | 'student'

type SeedUser = {
  id: string
  email: string
  displayName: string
  role: ApiRole
}

type AuthTokenPayload = {
  userId: string
  role: ApiRole
  exp: number
}

type AchievementInput = {
  title: string
  description: string
  category: string
  collection: string
  color: string
  icon: string
  imageUrl: string | null
  imageDataUrl: unknown
  hasImageDataUrl: boolean
  active: boolean
}

type GrantInput = {
  studentIds: string[]
  achievementId: string
  note: string | null
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
const AUTH_TOKEN_SECRET =
  process.env.AUTH_TOKEN_SECRET?.trim() ||
  (process.env.NODE_ENV !== 'production' && process.env.ALLOW_INSECURE_DEV_AUTH === 'true'
    ? 'seminario-album-dev-secret'
    : '')
const AUTH_TOKEN_TTL_MS = 1000 * 60 * 60 * 12
const MAX_IMAGE_BYTES = 2_000_000
const MAX_BATCH_GRANT_SIZE = 200
const ALLOWED_CATEGORIES = new Set(['Leitura', 'Frequencia', 'Participacao', 'Memorizacao', 'Modulo', 'Comportamento'])
const ALLOWED_COLORS = new Set(['clay', 'gold', 'teal', 'olive', 'navy', 'rose'])
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const STAFF_ROLES: ApiRole[] = ['superadmin', 'director', 'professor']
const CATALOG_MANAGER_ROLES: ApiRole[] = ['superadmin', 'director']
const ACHIEVEMENT_SELECT =
  'id, title, description, category, collection, color, icon, image_url, (image_data is not null) as has_image, active'
const STUDENT_ACHIEVEMENT_SELECT =
  'id, student_id, achievement_id, granted_by, granted_by_role, granted_at, status, note, removed_at, removed_by, removed_by_role'

if (!AUTH_TOKEN_SECRET) {
  throw new Error('AUTH_TOKEN_SECRET is required. For local-only development, set ALLOW_INSECURE_DEV_AUTH=true.')
}

const SEED_USERS: SeedUser[] = [
  { id: 'u-admin', email: 'admin@seminario.com', displayName: 'Admin Sistema', role: 'superadmin' },
  { id: 'u-director-1', email: 'director@seminario.com', displayName: 'Dir Roberto Alves', role: 'director' },
  { id: 'u-teacher-1', email: 'professor@seminario.com', displayName: 'Prof Ana Silva', role: 'professor' },
  { id: 'u-teacher-2', email: 'carlos@seminario.com', displayName: 'Prof Carlos Souza', role: 'professor' },
  { id: 's-1', email: 'student@seminario.com', displayName: 'Julia Martins', role: 'student' },
]

const SEED_CLASSES = [
  { id: 'c-1', teacherId: 'u-teacher-1' },
  { id: 'c-2', teacherId: 'u-teacher-2' },
]

const SEED_STUDENTS = [
  { id: 's-1', classId: 'c-1' },
  { id: 's-2', classId: 'c-1' },
  { id: 's-3', classId: 'c-1' },
  { id: 's-4', classId: 'c-2' },
]

function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function logError(message: string, error: unknown): void {
  // eslint-disable-next-line no-console
  console.error(message, error)
}

function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readOptionalTrimmedString(value: unknown): string | null {
  const normalized = readTrimmedString(value)
  return normalized ? normalized : null
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isSafeImageBuffer(mime: string, bytes: Buffer): boolean {
  if (mime === 'image/png') {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  }

  if (mime === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }

  if (mime === 'image/gif') {
    return bytes.length >= 6 && (bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a')
  }

  if (mime === 'image/webp') {
    return bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  }

  return false
}

function parseImageDataUrl(value: unknown, maxBytes = MAX_IMAGE_BYTES): { mime: string; bytes: Buffer } | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(trimmed)
  if (!match) return null

  const mime = match[1].toLowerCase()
  const base64 = match[2]
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mime)) return null
  if (base64.length % 4 !== 0) return null

  const bytes = Buffer.from(base64, 'base64')
  if (bytes.length === 0 || bytes.length > maxBytes) return null

  const normalizedBase64 = base64.replace(/=+$/u, '')
  if (bytes.toString('base64').replace(/=+$/u, '') !== normalizedBase64) return null
  if (!isSafeImageBuffer(mime, bytes)) return null

  return { mime, bytes }
}

function createTokenSignature(encodedPayload: string): string {
  return createHmac('sha256', AUTH_TOKEN_SECRET).update(encodedPayload).digest('base64url')
}

function issueAuthToken(user: SeedUser): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    role: user.role,
    exp: Date.now() + AUTH_TOKEN_TTL_MS,
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedPayload}.${createTokenSignature(encodedPayload)}`
}

function verifyAuthToken(token: string): SeedUser | null {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = createTokenSignature(encodedPayload)
  const receivedSignatureBuffer = Buffer.from(signature)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)
  if (receivedSignatureBuffer.length !== expectedSignatureBuffer.length) return null
  if (!timingSafeEqual(receivedSignatureBuffer, expectedSignatureBuffer)) return null

  let payload: AuthTokenPayload
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as AuthTokenPayload
  } catch {
    return null
  }

  if (!payload?.userId || !payload?.role || typeof payload.exp !== 'number' || payload.exp <= Date.now()) {
    return null
  }

  return SEED_USERS.find((user) => user.id === payload.userId && user.role === payload.role) ?? null
}

function getBearerToken(req: Request): string | null {
  const authorization = req.get('authorization')?.trim()
  if (!authorization) return null

  const [scheme, token] = authorization.split(/\s+/, 2)
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null
  return token
}

function requireAuthUser(req: Request, res: Response): SeedUser | null {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return null
  }

  const user = verifyAuthToken(token)
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return null
  }

  return user
}

function requireRole(req: Request, res: Response, allowedRoles: ApiRole[]): SeedUser | null {
  const user = requireAuthUser(req, res)
  if (!user) return null

  if (!allowedRoles.includes(user.role)) {
    res.status(403).json({ error: 'Forbidden' })
    return null
  }

  return user
}

function managedStudentIds(user: SeedUser): string[] {
  if (user.role === 'superadmin' || user.role === 'director') {
    return SEED_STUDENTS.map((item) => item.id)
  }

  if (user.role === 'professor') {
    const classIds = SEED_CLASSES.filter((item) => item.teacherId === user.id).map((item) => item.id)
    return SEED_STUDENTS.filter((item) => classIds.includes(item.classId)).map((item) => item.id)
  }

  return [user.id]
}

function canManageStudentId(user: SeedUser, studentId: string): boolean {
  return managedStudentIds(user).includes(studentId)
}

function parseAchievementInput(body: Record<string, unknown>): { value?: AchievementInput; error?: string } {
  const title = readTrimmedString(body.title)
  const description = readTrimmedString(body.description)
  const category = readTrimmedString(body.category)
  const collection = readTrimmedString(body.collection)
  const color = readTrimmedString(body.color)
  const icon = readTrimmedString(body.icon)
  const imageUrl = readOptionalTrimmedString(body.imageUrl ?? body.image_url)
  const imageDataUrl = body.imageDataUrl ?? body.image_data_url
  const active = body.active

  if (!title || title.length > 120) return { error: 'Invalid title' }
  if (!description || description.length > 500) return { error: 'Invalid description' }
  if (!ALLOWED_CATEGORIES.has(category)) return { error: 'Invalid category' }
  if (!collection || collection.length > 120) return { error: 'Invalid collection' }
  if (!ALLOWED_COLORS.has(color)) return { error: 'Invalid color' }
  if (!icon || icon.length > 16) return { error: 'Invalid icon' }
  if (imageUrl && !isValidUrl(imageUrl)) return { error: 'Invalid imageUrl' }
  if (typeof active !== 'boolean') return { error: 'Invalid active flag' }

  const hasImageDataUrl =
    Object.prototype.hasOwnProperty.call(body, 'imageDataUrl') || Object.prototype.hasOwnProperty.call(body, 'image_data_url')

  return {
    value: {
      title,
      description,
      category,
      collection,
      color,
      icon,
      imageUrl,
      imageDataUrl,
      hasImageDataUrl,
      active,
    },
  }
}

function parseGrantInput(body: Record<string, unknown>): { value?: GrantInput; error?: string } {
  const studentIds = Array.isArray(body.studentIds) ? body.studentIds : []
  const achievementId = readTrimmedString(body.achievementId)
  const note = readOptionalTrimmedString(body.note)

  const cleanStudentIds = Array.from(
    new Set(
      studentIds
        .map((item) => readTrimmedString(item))
        .filter(Boolean),
    ),
  )

  if (cleanStudentIds.length === 0 || cleanStudentIds.length > MAX_BATCH_GRANT_SIZE) {
    return { error: 'Invalid studentIds' }
  }

  if (!achievementId || achievementId.length > 120) {
    return { error: 'Invalid achievementId' }
  }

  if (note && note.length > 500) {
    return { error: 'Invalid note' }
  }

  return {
    value: {
      studentIds: cleanStudentIds,
      achievementId,
      note,
    },
  }
}

async function achievementExists(client: PoolClient, achievementId: string): Promise<boolean> {
  const result = await client.query('select 1 from achievements where id=$1 limit 1', [achievementId])
  return (result.rowCount ?? 0) > 0
}

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN)

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '6mb' }))
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

      if (allowedOrigins.length === 0) {
        if (origin === 'http://localhost:5173' || origin === 'http://localhost:4173') {
          return callback(null, true)
        }

        return callback(new Error('CORS blocked: set CORS_ORIGIN'))
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('CORS blocked'))
    },
    credentials: true,
  }),
)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

async function ensureTables(): Promise<void> {
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

  await pool.query('alter table achievements add column if not exists image_mime text')
  await pool.query('alter table achievements add column if not exists image_data bytea')

  await pool.query(`
    create table if not exists student_achievements (
      id text primary key,
      student_id text not null,
      achievement_id text not null,
      granted_by text not null,
      granted_by_role text not null,
      granted_at timestamptz not null default now(),
      status text not null default 'granted',
      note text,
      removed_at timestamptz,
      removed_by text,
      removed_by_role text
    );
  `)

  await pool.query('alter table student_achievements add column if not exists removed_by text')
  await pool.query('alter table student_achievements add column if not exists removed_by_role text')
  await pool.query(
    "create unique index if not exists ux_student_achievement_active on student_achievements(student_id, achievement_id) where status='granted'",
  )

  const existing = await pool.query('select count(1)::int as count from achievements')
  const count = Number(existing.rows[0]?.count ?? 0)
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
      imageUrl: null,
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
      imageUrl: null,
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
      imageUrl: null,
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
      imageUrl: null,
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
      imageUrl: null,
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
      imageUrl: '/achievements/convidou-amigo-seminario.jpg',
      active: true,
    },
  ]

  for (const item of seed) {
    await pool.query(
      `insert into achievements (id, title, description, category, collection, color, icon, image_url, active)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (id) do nothing`,
      [item.id, item.title, item.description, item.category, item.collection, item.color, item.icon, item.imageUrl, item.active],
    )
  }
}

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true })
})

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true })
})

app.post('/api/login', (req, res) => {
  const email = readTrimmedString(req.body?.email).toLowerCase()
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Invalid input' })
    return
  }

  const user = SEED_USERS.find((item) => item.email === email)
  if (!user) {
    res.status(401).json({ error: 'User not found' })
    return
  }

  res.status(200).json({
    token: issueAuthToken(user),
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  })
})

app.get('/api/me', (req, res) => {
  const user = requireAuthUser(req, res)
  if (!user) return

  res.status(200).json({
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
    const result = await pool.query(`select ${ACHIEVEMENT_SELECT} from achievements order by created_at asc`)
    res.status(200).json({ achievements: result.rows })
  } catch (error) {
    logError('Failed to list achievements', error)
    res.status(500).json({ error: 'Failed to list achievements' })
  }
})

app.get('/api/achievements/:id/image', async (req, res) => {
  const id = String(req.params.id)

  try {
    const result = await pool.query('select image_mime, image_data from achievements where id=$1', [id])
    const row = result.rows[0]
    if (!row?.image_data || !row?.image_mime) {
      res.status(404).send('Not found')
      return
    }

    res.setHeader('Content-Type', row.image_mime)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.status(200).send(row.image_data)
  } catch (error) {
    logError('Failed to load achievement image', error)
    res.status(500).send('Failed')
  }
})

app.post('/api/achievements', async (req, res) => {
  const actor = requireRole(req, res, CATALOG_MANAGER_ROLES)
  if (!actor) return

  const parsed = parseAchievementInput(req.body ?? {})
  if (!parsed.value) {
    res.status(400).json({ error: parsed.error ?? 'Invalid payload' })
    return
  }

  const imageBlob = parseImageDataUrl(parsed.value.imageDataUrl)
  if (parsed.value.hasImageDataUrl && parsed.value.imageDataUrl !== null && !imageBlob) {
    res.status(400).json({ error: 'Invalid imageDataUrl' })
    return
  }

  try {
    const result = await pool.query(
      `insert into achievements (id, title, description, category, collection, color, icon, image_url, image_mime, image_data, active)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       returning ${ACHIEVEMENT_SELECT}`,
      [
        randomUUID(),
        parsed.value.title,
        parsed.value.description,
        parsed.value.category,
        parsed.value.collection,
        parsed.value.color,
        parsed.value.icon,
        parsed.value.imageUrl,
        imageBlob?.mime ?? null,
        imageBlob?.bytes ?? null,
        parsed.value.active,
      ],
    )

    res.status(201).json({ achievement: result.rows[0], savedBy: actor.id })
  } catch (error) {
    logError('Failed to create achievement', error)
    res.status(500).json({ error: 'Failed to create achievement' })
  }
})

app.put('/api/achievements/:id', async (req, res) => {
  const actor = requireRole(req, res, CATALOG_MANAGER_ROLES)
  if (!actor) return

  const id = String(req.params.id)
  const parsed = parseAchievementInput(req.body ?? {})
  if (!parsed.value) {
    res.status(400).json({ error: parsed.error ?? 'Invalid payload' })
    return
  }

  const imageBlob = parseImageDataUrl(parsed.value.imageDataUrl)
  if (parsed.value.hasImageDataUrl && parsed.value.imageDataUrl !== null && !imageBlob) {
    res.status(400).json({ error: 'Invalid imageDataUrl' })
    return
  }

  try {
    const result = parsed.value.hasImageDataUrl
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
           returning ${ACHIEVEMENT_SELECT}`,
          [
            id,
            parsed.value.title,
            parsed.value.description,
            parsed.value.category,
            parsed.value.collection,
            parsed.value.color,
            parsed.value.icon,
            parsed.value.imageUrl,
            imageBlob?.mime ?? null,
            imageBlob?.bytes ?? null,
            parsed.value.active,
          ],
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
           returning ${ACHIEVEMENT_SELECT}`,
          [
            id,
            parsed.value.title,
            parsed.value.description,
            parsed.value.category,
            parsed.value.collection,
            parsed.value.color,
            parsed.value.icon,
            parsed.value.imageUrl,
            parsed.value.active,
          ],
        )

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    res.status(200).json({ achievement: result.rows[0], savedBy: actor.id })
  } catch (error) {
    logError('Failed to update achievement', error)
    res.status(500).json({ error: 'Failed to update achievement' })
  }
})

app.get('/api/student-achievements', async (req, res) => {
  const user = requireAuthUser(req, res)
  if (!user) return

  const requestedStudentId = readOptionalTrimmedString(req.query.studentId)
  const allowedStudentIds = managedStudentIds(user)
  const studentId = user.role === 'student' ? user.id : requestedStudentId

  if (studentId && !allowedStudentIds.includes(studentId)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  try {
    const result = studentId
      ? await pool.query(
          `select ${STUDENT_ACHIEVEMENT_SELECT}
           from student_achievements
           where student_id=$1
           order by granted_at desc`,
          [studentId],
        )
      : user.role === 'professor'
        ? await pool.query(
            `select ${STUDENT_ACHIEVEMENT_SELECT}
             from student_achievements
             where student_id = any($1::text[])
             order by granted_at desc`,
            [allowedStudentIds],
          )
      : await pool.query(
          `select ${STUDENT_ACHIEVEMENT_SELECT}
           from student_achievements
           order by granted_at desc`,
        )

    res.status(200).json({ studentAchievements: result.rows })
  } catch (error) {
    logError('Failed to list student achievements', error)
    res.status(500).json({ error: 'Failed to list student achievements' })
  }
})

app.post('/api/student-achievements/grant', async (req, res) => {
  const actor = requireRole(req, res, STAFF_ROLES)
  if (!actor) return

  const parsed = parseGrantInput(req.body ?? {})
  if (!parsed.value) {
    res.status(400).json({ error: parsed.error ?? 'Invalid payload' })
    return
  }

  if (!parsed.value.studentIds.every((studentId) => canManageStudentId(actor, studentId))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const exists = await achievementExists(client, parsed.value.achievementId)
    if (!exists) {
      await client.query('ROLLBACK')
      res.status(404).json({ error: 'Achievement not found' })
      return
    }

    const inserted: unknown[] = []
    const grantedAt = new Date().toISOString()

    for (const studentId of parsed.value.studentIds) {
      const result = await client.query(
        `insert into student_achievements (id, student_id, achievement_id, granted_by, granted_by_role, granted_at, status, note)
         values ($1,$2,$3,$4,$5,$6,'granted',$7)
         on conflict (student_id, achievement_id) where status='granted' do nothing
         returning ${STUDENT_ACHIEVEMENT_SELECT}`,
        [randomUUID(), studentId, parsed.value.achievementId, actor.displayName, actor.role, grantedAt, parsed.value.note],
      )

      if (result.rows[0]) {
        inserted.push(result.rows[0])
      }
    }

    await client.query('COMMIT')
    res.status(200).json({ insertedCount: inserted.length, inserted })
  } catch (error) {
    await client.query('ROLLBACK')
    logError('Failed to grant achievement', error)
    res.status(500).json({ error: 'Failed to grant achievement' })
  } finally {
    client.release()
  }
})

app.post('/api/student-achievements/:id/remove', async (req, res) => {
  const actor = requireRole(req, res, STAFF_ROLES)
  if (!actor) return

  const id = String(req.params.id)

  try {
    const existing = await pool.query('select student_id from student_achievements where id=$1 limit 1', [id])
    const studentId = String(existing.rows[0]?.student_id ?? '')
    if (!studentId) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    if (!canManageStudentId(actor, studentId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const result = await pool.query(
      `update student_achievements
       set status='removed',
           removed_at=now(),
           removed_by=$2,
           removed_by_role=$3
       where id=$1 and status='granted'
       returning ${STUDENT_ACHIEVEMENT_SELECT}`,
      [id, actor.displayName, actor.role],
    )

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    res.status(200).json({ studentAchievement: result.rows[0] })
  } catch (error) {
    logError('Failed to remove student achievement', error)
    res.status(500).json({ error: 'Failed to remove student achievement' })
  }
})

app.get('/db', async (req, res) => {
  const actor = requireRole(req, res, ['superadmin'])
  if (!actor) return

  try {
    const result = await pool.query('select now() as now')
    res.status(200).json({ ok: true, now: result.rows[0]?.now ?? null, actor: actor.id })
  } catch (error) {
    logError('Failed to query DB health endpoint', error)
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
  .catch((error) => {
    logError('Failed to initialize DB schema', error)
    process.exit(1)
  })
