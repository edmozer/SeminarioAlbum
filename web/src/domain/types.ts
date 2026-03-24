export type Role = 'superadmin' | 'director' | 'professor' | 'student'

export type AchievementCategory =
  | 'Leitura'
  | 'Frequencia'
  | 'Participacao'
  | 'Memorizacao'
  | 'Modulo'
  | 'Comportamento'

export interface UserSession {
  role: Role
  userId: string
  displayName: string
}

export interface ClassRoom {
  id: string
  name: string
  teacherId: string
  teacherName: string
  schedule: string
  active: boolean
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  classId: string
  active: boolean
}

export interface Achievement {
  id: string
  title: string
  description: string
  category: AchievementCategory
  collection: string
  color: 'clay' | 'gold' | 'teal' | 'olive' | 'navy' | 'rose'
  icon: string
  imageUrl?: string
  active: boolean
}

export interface StudentAchievement {
  id: string
  studentId: string
  achievementId: string
  grantedBy: string
  grantedByRole: Role
  grantedAt: string
  status: 'granted' | 'removed'
  note?: string
  removedAt?: string
}

export interface Invite {
  id: string
  email: string
  classId: string
  status: 'pending' | 'accepted' | 'cancelled' | 'expired'
  token: string
  createdBy: string
  createdAt: string
  acceptedAt?: string
}

export interface AuditLog {
  id: string
  action: string
  actor: string
  actorRole: Role
  target: string
  createdAt: string
  details: string
}

export interface AppData {
  classes: ClassRoom[]
  students: Student[]
  achievements: Achievement[]
  studentAchievements: StudentAchievement[]
  invites: Invite[]
  auditLogs: AuditLog[]
}
