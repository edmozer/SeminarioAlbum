/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { seedData, sessions } from '../domain/seed'
import type { AppData, Invite, Role, StudentAchievement, Teacher, UserSession } from '../domain/types'
import { ApiError, fetchAchievements, fetchCurrentUser, fetchStudentAchievements } from '../lib/api'
import { createInviteToken, emailToPersonName, isValidEmail, uid } from '../lib/utils'

const STORAGE_SESSION_KEY = 'album_session'
const STORAGE_DATA_KEY_PREFIX = 'album_data_v2'

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function readStoredSession(): UserSession | null {
  const parsed = safeParseJson<Partial<UserSession>>(localStorage.getItem(STORAGE_SESSION_KEY))
  if (!parsed) return null

  if (
    typeof parsed.role !== 'string' ||
    typeof parsed.userId !== 'string' ||
    typeof parsed.displayName !== 'string' ||
    typeof parsed.email !== 'string'
  ) {
    return null
  }

  return {
    role: parsed.role,
    userId: parsed.userId,
    displayName: parsed.displayName,
    email: parsed.email,
    authToken: typeof parsed.authToken === 'string' ? parsed.authToken : undefined,
  }
}

interface UIState {
  selectedClassId: string | null
  selectedStudentId: string | null
  toastMessage: string | null
}

interface RootState {
  data: AppData
  session: UserSession | null
  ui: UIState
}

type Action =
  | { type: 'login'; payload: UserSession }
  | { type: 'logout' }
  | { type: 'switch-role'; payload: Role }
  | { type: 'select-class'; payload: string | null }
  | { type: 'select-student'; payload: string | null }
  | { type: 'teacher-create'; payload: { displayName: string; email: string } }
  | { type: 'teacher-update'; payload: { teacherId: string; displayName: string; email: string } }
  | { type: 'teacher-toggle'; payload: { teacherId: string; active: boolean } }
  | { type: 'class-assign-teacher'; payload: { classId: string; teacherId: string } }
  | { type: 'class-update'; payload: { classId: string; name: string; schedule: string; active: boolean } }
  | { type: 'achievements-replace'; payload: { achievements: AppData['achievements'] } }
  | { type: 'student-achievements-replace'; payload: { studentAchievements: AppData['studentAchievements'] } }
  | { type: 'grant-achievement'; payload: { studentIds: string[]; achievementId: string; note?: string } }
  | { type: 'remove-student-achievement'; payload: { studentAchievementId: string } }
  | { type: 'invite-create'; payload: { email: string; classId: string } }
  | { type: 'invite-cancel'; payload: { inviteId: string } }
  | { type: 'invite-accept-simulate'; payload: { inviteId: string } }
  | { type: 'toast'; payload: string | null }

interface AppContextValue {
  state: RootState
  dispatch: React.Dispatch<Action>
  visibleClassIds: string[]
  visibleTeachers: Teacher[]
  visibleStudents: RootState['data']['students']
  visibleInvites: Invite[]
  visibleAchievements: RootState['data']['achievements']
  activeStudentAchievements: StudentAchievement[]
  selectedClassId: string | null
  setToast: (message: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function dataStorageKey(userId: string): string {
  return `${STORAGE_DATA_KEY_PREFIX}:${userId}`
}

function loadDataForSession(session: UserSession | null): AppData {
  const base = structuredClone(seedData)
  if (!session) return base

  const persistedData = safeParseJson<Partial<AppData>>(localStorage.getItem(dataStorageKey(session.userId)))
  return persistedData ? ({ ...base, ...persistedData } as AppData) : base
}

function isStaffRole(role: Role): boolean {
  return role === 'superadmin' || role === 'director' || role === 'professor'
}

function managedClassIds(data: AppData, session: UserSession): string[] {
  if (session.role === 'professor') {
    return data.classes.filter((item) => item.teacherId === session.userId).map((item) => item.id)
  }

  return data.classes.map((item) => item.id)
}

function canManageStudent(data: AppData, session: UserSession, studentId: string): boolean {
  if (session.role === 'superadmin' || session.role === 'director') {
    return data.students.some((item) => item.id === studentId)
  }

  if (session.role !== 'professor') {
    return false
  }

  const student = data.students.find((item) => item.id === studentId)
  if (!student) return false
  return managedClassIds(data, session).includes(student.classId)
}

function canManageInviteClass(data: AppData, session: UserSession, classId: string): boolean {
  if (session.role === 'superadmin' || session.role === 'director') {
    return data.classes.some((item) => item.id === classId)
  }

  if (session.role !== 'professor') {
    return false
  }

  return managedClassIds(data, session).includes(classId)
}

function initialState(): RootState {
  const session = readStoredSession()
  const data = loadDataForSession(session)

  // If we have a session (e.g. professor), we might want to default select a class
  const selectedClassId =
    session?.role === 'professor'
      ? data.classes.find((item) => item.teacherId === session?.userId)?.id ?? null
      : null

  return {
    data,
    session,
    ui: {
      selectedClassId,
      selectedStudentId: null,
      toastMessage: null,
    },
  }
}

function appendAudit(base: AppData, actor: UserSession | null, action: string, target: string, details: string): AppData {
  return {
    ...base,
    auditLogs: [
      {
        id: uid('log'),
        action,
        actorUserId: actor?.userId ?? 'anonymous',
        actor: actor?.displayName ?? 'Unknown',
        actorRole: actor?.role ?? 'student',
        target,
        createdAt: new Date().toISOString(),
        details,
      },
      ...base.auditLogs,
    ],
  }
}

function reducer(state: RootState, action: Action): RootState {
  if (action.type === 'achievements-replace') {
    return {
      ...state,
      data: {
        ...state.data,
        achievements: action.payload.achievements,
      },
    }
  }

  if (action.type === 'student-achievements-replace') {
    return {
      ...state,
      data: {
        ...state.data,
        studentAchievements: action.payload.studentAchievements,
      },
    }
  }

  if (action.type === 'teacher-create') {
    if (!state.session || (state.session.role !== 'director' && state.session.role !== 'superadmin')) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para gerenciar professores.' } }
    }

    const displayName = action.payload.displayName.trim()
    const email = action.payload.email.trim().toLowerCase()

    if (!displayName || !isValidEmail(email)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Informe nome e email validos.' } }
    }

    if (state.data.teachers.some((t) => t.email.toLowerCase() === email)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Ja existe um professor com este email.' } }
    }

    const teacher: Teacher = {
      id: uid('u-teacher'),
      displayName,
      email,
      active: true,
    }

    const dataWithAudit = appendAudit(
      { ...state.data, teachers: [teacher, ...state.data.teachers] },
      state.session,
      'teacher_created',
      displayName,
      `Criou professor (${email}).`,
    )

    return { ...state, data: dataWithAudit, ui: { ...state.ui, toastMessage: 'Professor criado.' } }
  }

  if (action.type === 'teacher-update') {
    if (!state.session || (state.session.role !== 'director' && state.session.role !== 'superadmin')) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para gerenciar professores.' } }
    }

    const displayName = action.payload.displayName.trim()
    const email = action.payload.email.trim().toLowerCase()
    if (!displayName || !isValidEmail(email)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Informe nome e email validos.' } }
    }

    const existing = state.data.teachers.find((t) => t.id === action.payload.teacherId)
    if (!existing) return state

    if (state.data.teachers.some((t) => t.id !== existing.id && t.email.toLowerCase() === email)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Ja existe um professor com este email.' } }
    }

    const teachers = state.data.teachers.map((t) =>
      t.id === existing.id ? { ...t, displayName, email } : t,
    )

    // Keep class teacherName in sync
    const classes = state.data.classes.map((c) =>
      c.teacherId === existing.id ? { ...c, teacherName: displayName } : c,
    )

    const dataWithAudit = appendAudit(
      { ...state.data, teachers, classes },
      state.session,
      'teacher_updated',
      displayName,
      'Atualizou dados do professor.',
    )

    return { ...state, data: dataWithAudit, ui: { ...state.ui, toastMessage: 'Professor atualizado.' } }
  }

  if (action.type === 'teacher-toggle') {
    if (!state.session || (state.session.role !== 'director' && state.session.role !== 'superadmin')) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para gerenciar professores.' } }
    }

    const existing = state.data.teachers.find((t) => t.id === action.payload.teacherId)
    if (!existing) return state

    const teachers = state.data.teachers.map((t) =>
      t.id === existing.id ? { ...t, active: action.payload.active } : t,
    )

    const dataWithAudit = appendAudit(
      { ...state.data, teachers },
      state.session,
      'teacher_status_changed',
      existing.displayName,
      action.payload.active ? 'Ativou professor.' : 'Desativou professor.',
    )

    return { ...state, data: dataWithAudit, ui: { ...state.ui, toastMessage: action.payload.active ? 'Professor ativado.' : 'Professor desativado.' } }
  }

  if (action.type === 'class-assign-teacher') {
    if (!state.session || (state.session.role !== 'director' && state.session.role !== 'superadmin')) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para designar professor.' } }
    }

    const classRoom = state.data.classes.find((c) => c.id === action.payload.classId)
    const teacher = state.data.teachers.find((t) => t.id === action.payload.teacherId)
    if (!classRoom || !teacher) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Professor ou classe nao encontrados.' } }
    }

    const classes = state.data.classes.map((c) =>
      c.id === classRoom.id ? { ...c, teacherId: teacher.id, teacherName: teacher.displayName } : c,
    )

    const dataWithAudit = appendAudit(
      { ...state.data, classes },
      state.session,
      'class_teacher_assigned',
      classRoom.name,
      `Designou ${teacher.displayName} para a classe.`,
    )

    return { ...state, data: dataWithAudit, ui: { ...state.ui, toastMessage: 'Professor designado.' } }
  }

  if (action.type === 'class-update') {
    if (!state.session) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem sessao.' } }
    }

    const classRoom = state.data.classes.find((c) => c.id === action.payload.classId)
    if (!classRoom) return state

    const canEdit =
      state.session.role === 'superadmin' ||
      state.session.role === 'director' ||
      (state.session.role === 'professor' && classRoom.teacherId === state.session.userId)

    if (!canEdit) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para editar classe.' } }
    }

    const name = action.payload.name.trim()
    const schedule = action.payload.schedule.trim()
    if (!name || !schedule) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Informe nome e horario.' } }
    }

    const classes = state.data.classes.map((c) =>
      c.id === classRoom.id ? { ...c, name, schedule, active: action.payload.active } : c,
    )

    const dataWithAudit = appendAudit(
      { ...state.data, classes },
      state.session,
      'class_updated',
      classRoom.name,
      'Atualizou dados da classe.',
    )

    return { ...state, data: dataWithAudit, ui: { ...state.ui, toastMessage: 'Classe atualizada.' } }
  }

  if (action.type === 'login') {
    const nextData = loadDataForSession(action.payload)
    return {
      ...state,
      data: nextData,
      session: action.payload,
      ui: {
        ...state.ui,
        // Auto-select class for professor
        selectedClassId:
          action.payload.role === 'professor'
            ? nextData.classes.find((item) => item.teacherId === action.payload.userId)?.id ?? null
            : null,
        selectedStudentId: action.payload.role === 'student' ? action.payload.userId : null,
      },
    }
  }

  if (action.type === 'logout') {
    return {
      ...state,
      data: structuredClone(seedData),
      session: null,
      ui: { ...state.ui, selectedClassId: null, selectedStudentId: null, toastMessage: null },
    }
  }

  if (action.type === 'switch-role') {
    const session = sessions[action.payload]
    const nextData = loadDataForSession(session)
    const classForTeacher = nextData.classes.find((item) => item.teacherId === session.userId)?.id ?? null
    return {
      ...state,
      data: nextData,
      session,
      ui: {
        ...state.ui,
        selectedClassId: session.role === 'professor' ? classForTeacher : null,
        selectedStudentId: session.role === 'student' ? session.userId : null,
      },
    }
  }

  if (action.type === 'select-class') {
    return { ...state, ui: { ...state.ui, selectedClassId: action.payload, selectedStudentId: null } }
  }

  if (action.type === 'select-student') {
    return { ...state, ui: { ...state.ui, selectedStudentId: action.payload } }
  }

  if (action.type === 'toast') {
    return { ...state, ui: { ...state.ui, toastMessage: action.payload } }
  }

  if (action.type === 'grant-achievement') {
    if (!state.session || !isStaffRole(state.session.role)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para conceder.' } }
    }

    const actor = state.session
    const achievement = state.data.achievements.find((item) => item.id === action.payload.achievementId)
    if (!achievement || !achievement.active) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Conquista indisponivel para concessao.' } }
    }

    const allowedStudentIds = Array.from(new Set(action.payload.studentIds)).filter((studentId) =>
      canManageStudent(state.data, actor, studentId),
    )

    if (allowedStudentIds.length === 0) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Nenhum aluno valido foi selecionado.' } }
    }

    const now = new Date().toISOString()
    const current = state.data.studentAchievements
    const entries: StudentAchievement[] = []

    allowedStudentIds.forEach((studentId) => {
      const already = current.find(
        (item) =>
          item.studentId === studentId &&
          item.achievementId === action.payload.achievementId &&
          item.status === 'granted',
      )
      if (!already) {
        entries.push({
          id: uid('sa'),
          studentId,
          achievementId: action.payload.achievementId,
          grantedBy: actor.displayName,
          grantedByRole: actor.role,
          grantedAt: now,
          status: 'granted',
          note: action.payload.note,
        })
      }
    })

    const target = `${entries.length} aluno(s)`
    const details = `Concedeu ${achievement?.title ?? 'achievement'} para ${entries.length} aluno(s).`

    const dataWithAudit = appendAudit(
      { ...state.data, studentAchievements: [...entries, ...state.data.studentAchievements] },
      actor,
      'grant_achievement',
      target,
      details,
    )

    return {
      ...state,
      data: dataWithAudit,
      ui: {
        ...state.ui,
        toastMessage: entries.length > 0 ? `Concedido para ${entries.length} aluno(s).` : 'Todos ja tinham essa conquista.',
      },
    }
  }

  if (action.type === 'remove-student-achievement') {
    if (!state.session || !isStaffRole(state.session.role)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para remover.' } }
    }
    const item = state.data.studentAchievements.find((entry) => entry.id === action.payload.studentAchievementId)
    if (!item) {
      return state
    }

    if (!canManageStudent(state.data, state.session, item.studentId)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para remover esta conquista.' } }
    }

    const achievementTitle =
      state.data.achievements.find((entry) => entry.id === item.achievementId)?.title ?? item.achievementId

    const studentName =
      (() => {
        const s = state.data.students.find((entry) => entry.id === item.studentId)
        return s ? `${s.firstName} ${s.lastName}` : item.studentId
      })()

    const actor = state.session

    const updated = state.data.studentAchievements.map((entry) =>
      entry.id === action.payload.studentAchievementId
        ? {
            ...entry,
            status: 'removed' as const,
            removedAt: new Date().toISOString(),
            removedBy: actor.displayName,
            removedByRole: actor.role,
          }
        : entry,
    )

    const dataWithAudit = appendAudit(
      { ...state.data, studentAchievements: updated },
      actor,
      'remove_achievement',
      studentName,
      `Removeu "${achievementTitle}".`,
    )

    return {
      ...state,
      data: dataWithAudit,
      ui: { ...state.ui, toastMessage: 'Conquista removida.' },
    }
  }

  if (action.type === 'invite-create') {
    if (!state.session || !isStaffRole(state.session.role)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para criar convite.' } }
    }

    const email = action.payload.email.trim().toLowerCase()
    if (!isValidEmail(email)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Informe um email valido.' } }
    }

    if (!canManageInviteClass(state.data, state.session, action.payload.classId)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para convidar alunos desta classe.' } }
    }

    const invite: Invite = {
      id: uid('inv'),
      email,
      classId: action.payload.classId,
      status: 'pending',
      token: createInviteToken(),
      createdBy: state.session.displayName,
      createdAt: new Date().toISOString(),
    }

    const dataWithAudit = appendAudit(
      { ...state.data, invites: [invite, ...state.data.invites] },
      state.session,
      'invite_created',
      invite.email,
      'Criou um novo convite.',
    )

    return {
      ...state,
      data: dataWithAudit,
      ui: { ...state.ui, toastMessage: 'Convite criado com sucesso.' },
    }
  }

  if (action.type === 'invite-cancel') {
    if (!state.session || !isStaffRole(state.session.role)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para cancelar convite.' } }
    }

    const invite = state.data.invites.find((entry) => entry.id === action.payload.inviteId)
    if (!invite) {
      return state
    }

    if (!canManageInviteClass(state.data, state.session, invite.classId)) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para cancelar este convite.' } }
    }

    const invites = state.data.invites.map((invite) =>
      invite.id === action.payload.inviteId ? { ...invite, status: 'cancelled' as const } : invite,
    )

    const dataWithAudit = appendAudit(
      { ...state.data, invites },
      state.session,
      'invite_cancelled',
      action.payload.inviteId,
      'Cancelou convite.',
    )

    return { ...state, data: dataWithAudit, ui: { ...state.ui, toastMessage: 'Convite cancelado.' } }
  }

  if (action.type === 'invite-accept-simulate') {
    if (!state.session) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Faca login para aceitar ou simular convites.' } }
    }

    const invite = state.data.invites.find((entry) => entry.id === action.payload.inviteId)
    if (!invite || invite.status !== 'pending') {
      return { ...state, ui: { ...state.ui, toastMessage: 'Este convite nao esta pendente.' } }
    }

    const acceptedInvites = state.data.invites.map((entry) =>
      entry.id === invite.id ? { ...entry, status: 'accepted' as const, acceptedAt: new Date().toISOString() } : entry,
    )

    let students = state.data.students

    if (state.session?.role === 'student') {
      const existing = state.data.students.find((item) => item.id === state.session?.userId)
      students = existing
        ? state.data.students.map((item) => (item.id === existing.id ? { ...item, classId: invite.classId } : item))
        : [
            {
              id: state.session!.userId,
              firstName: state.session!.displayName.split(' ')[0] ?? 'Aluno',
              lastName: state.session!.displayName.split(' ').slice(1).join(' ') || 'Sem sobrenome',
              classId: invite.classId,
              active: true,
            },
            ...state.data.students,
          ]
    } else {
      const person = emailToPersonName(invite.email)
      const studentId = uid('s')
      students = [
        {
          id: studentId,
          firstName: person.firstName,
          lastName: person.lastName,
          classId: invite.classId,
          active: true,
        },
        ...state.data.students,
      ]
    }

    const dataWithAudit = appendAudit(
      { ...state.data, invites: acceptedInvites, students },
      state.session,
      'invite_accepted',
      invite.email,
      'Convite aceito em simulacao e aluno adicionado.',
    )

    return { ...state, data: dataWithAudit, ui: { ...state.ui, toastMessage: 'Aluno adicionado pela simulacao de aceite.' } }
  }

  return state
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const toastTimerRef = useRef<number | null>(null)

  // Auto-dismiss toast messages quickly
  useEffect(() => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }

    if (!state.ui.toastMessage) return

    toastTimerRef.current = window.setTimeout(() => {
      dispatch({ type: 'toast', payload: null })
    }, 1000)

    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
    }
  }, [state.ui.toastMessage])

  useEffect(() => {
    if (!state.session?.authToken) return

    const session = state.session
    let cancelled = false

    void (async () => {
      try {
        const currentUser = await fetchCurrentUser(session)
        if (cancelled) return

        if (
          currentUser.id !== session.userId ||
          currentUser.role !== session.role ||
          currentUser.displayName !== session.displayName ||
          currentUser.email !== session.email
        ) {
          dispatch({
            type: 'login',
            payload: {
              role: currentUser.role,
              userId: currentUser.id,
              displayName: currentUser.displayName,
              email: currentUser.email,
              authToken: session.authToken,
            },
          })
        }
      } catch (error) {
        if (cancelled) return

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          dispatch({ type: 'logout' })
          dispatch({ type: 'toast', payload: 'Sua sessao expirou. Faca login novamente.' })
          return
        }

        dispatch({ type: 'toast', payload: 'Nao foi possivel validar sua sessao agora.' })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [state.session])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const achievements = await fetchAchievements(state.session)
        if (cancelled) return

        dispatch({
          type: 'achievements-replace',
          payload: { achievements },
        })
      } catch {
        // ignore; fallback to local seed/localStorage
      }
    })()

    return () => {
      cancelled = true
    }
  }, [state.session])

  useEffect(() => {
    if (!state.session) return

    const session = state.session
    let cancelled = false

    void (async () => {
      try {
        const studentAchievements = await fetchStudentAchievements(
          session,
          session.role === 'student' ? session.userId : undefined,
        )
        if (cancelled) return

        dispatch({
          type: 'student-achievements-replace',
          payload: { studentAchievements },
        })
      } catch {
        // ignore
      }
    })()

    return () => {
      cancelled = true
    }
  }, [state.session])

  // Prototype-grade persistence for demo: keeps changes on refresh.
  useEffect(() => {
    if (state.session) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(state.session))
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY)
    }
  }, [state.session])

  useEffect(() => {
    if (!state.session) return
    localStorage.setItem(dataStorageKey(state.session.userId), JSON.stringify(state.data))
  }, [state.data, state.session])

  const value = useMemo<AppContextValue>(() => {
    // Helper to avoid circular dependency in useMemo if we defined setToast inside
    // but we can define it inside since dispatch is stable
    const setToast = (message: string | null) => {
      dispatch({ type: 'toast', payload: message })
    }

    // If no session, provide safe defaults
    if (!state.session) {
      return {
        state,
        dispatch,
        visibleClassIds: [],
        visibleTeachers: [],
        visibleStudents: [],
        visibleInvites: [],
        visibleAchievements: [],
        activeStudentAchievements: [],
        selectedClassId: null,
        setToast,
      }
    }

    const visibleTeachers =
      state.session.role === 'superadmin' || state.session.role === 'director'
        ? state.data.teachers
        : state.session.role === 'professor'
          ? state.data.teachers.filter((t) => t.id === state.session?.userId)
          : []

    const visibleClassIds =
      state.session.role === 'professor'
        ? state.data.classes.filter((item) => item.teacherId === state.session?.userId).map((item) => item.id)
        : state.data.classes.map((item) => item.id)

    const selectedClassId =
      state.session.role === 'professor'
        ? state.ui.selectedClassId ?? visibleClassIds[0] ?? null
        : state.ui.selectedClassId

    const visibleStudents =
      state.session.role === 'student'
        ? state.data.students.filter((student) => student.id === state.session?.userId)
        : selectedClassId
          ? state.data.students.filter((student) => student.classId === selectedClassId)
          : state.data.students

    const visibleInvites =
      state.session.role === 'student'
        ? []
        : state.session.role === 'professor'
          ? state.data.invites.filter((invite) => visibleClassIds.includes(invite.classId))
          : state.data.invites

    const visibleAchievements = state.data.achievements.filter((achievement) => achievement.active)

    const activeStudentAchievements = state.data.studentAchievements.filter((item) => item.status === 'granted')

    return {
      state,
      dispatch,
      visibleClassIds,
      visibleTeachers,
      visibleStudents,
      visibleInvites,
      visibleAchievements,
      activeStudentAchievements,
      selectedClassId,
      setToast,
    }
  }, [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppState() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider')
  }
  return context
}
