import type { Achievement, AchievementCategory, StudentAchievement, UserSession } from '../domain/types'

const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  'Leitura',
  'Frequencia',
  'Participacao',
  'Memorizacao',
  'Modulo',
  'Comportamento',
]

const ACHIEVEMENT_COLORS: Achievement['color'][] = ['clay', 'gold', 'teal', 'olive', 'navy', 'rose']

export type ApiAchievementRow = {
  id: string
  title: string
  description: string
  category: string
  collection: string
  color: string
  icon: string
  image_url?: string | null
  has_image?: boolean
  active: boolean
}

export type ApiStudentAchievementRow = {
  id: string
  student_id: string
  achievement_id: string
  granted_by: string
  granted_by_role: StudentAchievement['grantedByRole']
  granted_at: string
  status: 'granted' | 'removed'
  note?: string | null
  removed_at?: string | null
  removed_by?: string | null
  removed_by_role?: StudentAchievement['grantedByRole'] | null
}

type ApiLoginResponse = {
  token: string
  user: {
    id: string
    email: string
    displayName: string
    role: UserSession['role']
  }
}

type ApiCurrentUserResponse = {
  user: {
    id: string
    email: string
    displayName: string
    role: UserSession['role']
  }
}

type ApiRequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit
  session?: UserSession | null
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
}

function coerceCategory(value: string): AchievementCategory {
  return ACHIEVEMENT_CATEGORIES.includes(value as AchievementCategory) ? (value as AchievementCategory) : 'Leitura'
}

function coerceColor(value: string): Achievement['color'] {
  return ACHIEVEMENT_COLORS.includes(value as Achievement['color']) ? (value as Achievement['color']) : 'clay'
}

async function readJsonSafely(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

function withAuthHeaders(headers: Headers, session?: UserSession | null): Headers {
  if (session?.authToken) {
    headers.set('Authorization', `Bearer ${session.authToken}`)
  }

  return headers
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = withAuthHeaders(new Headers(options.headers), options.session)
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  })

  const json = await readJsonSafely(response)

  if (!response.ok) {
    const message =
      json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
        ? json.error
        : 'Falha na requisicao.'
    throw new ApiError(message, response.status)
  }

  return json as T
}

export function mapAchievementRow(row: ApiAchievementRow): Achievement {
  const id = String(row.id)
  return {
    id,
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    category: coerceCategory(String(row.category ?? '')),
    collection: String(row.collection ?? ''),
    color: coerceColor(String(row.color ?? 'clay')),
    icon: String(row.icon ?? '🏅'),
    imageUrl: row.has_image ? `${getApiBaseUrl()}/api/achievements/${id}/image` : row.image_url ? String(row.image_url) : undefined,
    active: Boolean(row.active),
  }
}

export function mapStudentAchievementRow(row: ApiStudentAchievementRow): StudentAchievement {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    achievementId: String(row.achievement_id),
    grantedBy: String(row.granted_by),
    grantedByRole: row.granted_by_role,
    grantedAt: String(row.granted_at),
    status: row.status,
    note: row.note ? String(row.note) : undefined,
    removedAt: row.removed_at ? String(row.removed_at) : undefined,
    removedBy: row.removed_by ? String(row.removed_by) : undefined,
    removedByRole: row.removed_by_role ?? undefined,
  }
}

export async function loginWithEmail(email: string): Promise<ApiLoginResponse> {
  return apiRequest<ApiLoginResponse>('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

export async function fetchCurrentUser(session: UserSession): Promise<ApiCurrentUserResponse['user']> {
  const json = await apiRequest<ApiCurrentUserResponse>('/api/me', { session })
  return json.user
}

export async function fetchAchievements(session?: UserSession | null): Promise<Achievement[]> {
  const json = await apiRequest<{ achievements?: ApiAchievementRow[] }>('/api/achievements', { session })
  const rows = Array.isArray(json.achievements) ? json.achievements : []
  return rows.map(mapAchievementRow)
}

export async function fetchStudentAchievements(session: UserSession, studentId?: string): Promise<StudentAchievement[]> {
  const search = studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''
  const json = await apiRequest<{ studentAchievements?: ApiStudentAchievementRow[] }>(`/api/student-achievements${search}`, {
    session,
  })
  const rows = Array.isArray(json.studentAchievements) ? json.studentAchievements : []
  return rows.map(mapStudentAchievementRow)
}

type AchievementSaveInput = {
  title: string
  description: string
  category: AchievementCategory
  collection: string
  color: Achievement['color']
  icon: string
  imageUrl: string | null
  imageDataUrl?: string | null
  active: boolean
}

export async function saveAchievement(
  session: UserSession,
  payload: AchievementSaveInput,
  achievementId?: string,
): Promise<Achievement> {
  const path = achievementId ? `/api/achievements/${achievementId}` : '/api/achievements'
  const method = achievementId ? 'PUT' : 'POST'
  const json = await apiRequest<{ achievement: ApiAchievementRow }>(path, {
    method,
    session,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return mapAchievementRow(json.achievement)
}

export async function grantStudentAchievements(
  session: UserSession,
  payload: { studentIds: string[]; achievementId: string; note?: string | null },
): Promise<void> {
  await apiRequest('/api/student-achievements/grant', {
    method: 'POST',
    session,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function removeStudentAchievement(session: UserSession, studentAchievementId: string): Promise<void> {
  await apiRequest(`/api/student-achievements/${studentAchievementId}/remove`, {
    method: 'POST',
    session,
  })
}
