import { createContext, useContext, useMemo, useReducer, useState, type ReactNode } from 'react'
import { seedData, sessions } from '../domain/seed'
import type { AppData, Invite, Role, StudentAchievement, UserSession } from '../domain/types'
import { emailToPersonName, uid } from '../lib/utils'

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
  visibleStudents: RootState['data']['students']
  visibleInvites: Invite[]
  visibleAchievements: RootState['data']['achievements']
  activeStudentAchievements: StudentAchievement[]
  selectedClassId: string | null
  setToast: (message: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function initialState(): RootState {
  // Try to recover session from local storage
  let session: UserSession | null = null
  try {
    const stored = localStorage.getItem('album_session')
    if (stored) {
      session = JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to parse session', e)
  }

  // If we have a session (e.g. professor), we might want to default select a class
  const selectedClassId =
    session?.role === 'professor'
      ? seedData.classes.find((item) => item.teacherId === session?.userId)?.id ?? null
      : null

  return {
    data: structuredClone(seedData),
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
  const isStudent = state.session?.role === 'student'

  if (action.type === 'login') {
    return {
      ...state,
      session: action.payload,
      ui: {
        ...state.ui,
        // Auto-select class for professor
        selectedClassId:
          action.payload.role === 'professor'
            ? state.data.classes.find((item) => item.teacherId === action.payload.userId)?.id ?? null
            : null,
      },
    }
  }

  if (action.type === 'logout') {
    return {
      ...state,
      session: null,
      ui: { ...state.ui, selectedClassId: null, selectedStudentId: null },
    }
  }

  if (action.type === 'switch-role') {
    const session = sessions[action.payload]
    const classForTeacher = state.data.classes.find((item) => item.teacherId === session.userId)?.id ?? null
    return {
      ...state,
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
    if (isStudent || !state.session) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para conceder.' } }
    }
    const actor = state.session

    const now = new Date().toISOString()
    const current = state.data.studentAchievements
    const entries: StudentAchievement[] = []

    action.payload.studentIds.forEach((studentId) => {
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

    const achievement = state.data.achievements.find((item) => item.id === action.payload.achievementId)
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
    if (isStudent || !state.session) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para remover.' } }
    }
    const item = state.data.studentAchievements.find((entry) => entry.id === action.payload.studentAchievementId)
    if (!item) {
      return state
    }

    const achievementTitle =
      state.data.achievements.find((entry) => entry.id === item.achievementId)?.title ?? item.achievementId

    const studentName =
      (() => {
        const s = state.data.students.find((entry) => entry.id === item.studentId)
        return s ? `${s.firstName} ${s.lastName}` : item.studentId
      })()

    const updated = state.data.studentAchievements.map((entry) =>
      entry.id === action.payload.studentAchievementId
        ? { ...entry, status: 'removed' as const, removedAt: new Date().toISOString() }
        : entry,
    )

    // Safe access to session (if we are here, isStudent is false, so session should exist for professor/admin)
    const actor = state.session!

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
    if (isStudent || !state.session) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para criar convite.' } }
    }
    const invite: Invite = {
      id: uid('inv'),
      email: action.payload.email,
      classId: action.payload.classId,
      status: 'pending',
      token: `INV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
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
    if (isStudent || !state.session) {
      return { ...state, ui: { ...state.ui, toastMessage: 'Sem permissao para cancelar convite.' } }
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
  const [toastTimer, setToastTimer] = useState<number | null>(null)

  const value = useMemo<AppContextValue>(() => {
    // Helper to avoid circular dependency in useMemo if we defined setToast inside
    // but we can define it inside since dispatch is stable
    const setToast = (message: string | null) => {
      dispatch({ type: 'toast', payload: message })
      if (toastTimer) {
        window.clearTimeout(toastTimer)
      }
      if (message) {
        const timer = window.setTimeout(() => dispatch({ type: 'toast', payload: null }), 2400)
        setToastTimer(timer)
      }
    }

    // If no session, provide safe defaults
    if (!state.session) {
      return {
        state,
        dispatch,
        visibleClassIds: [],
        visibleStudents: [],
        visibleInvites: [],
        visibleAchievements: [],
        activeStudentAchievements: [],
        selectedClassId: null,
        setToast,
      }
    }

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
      visibleStudents,
      visibleInvites,
      visibleAchievements,
      activeStudentAchievements,
      selectedClassId,
      setToast,
    }
  }, [state, toastTimer])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppState() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider')
  }
  return context
}
