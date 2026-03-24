import type { AppData, UserSession } from './types'

// Generate ISO date strings relative to the current month so seed KPIs are always non-zero
function thisMonth(day: number, hour = 10): string {
  const d = new Date()
  d.setDate(day)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

function lastMonth(day: number, hour = 8): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  d.setDate(day)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const sessions: Record<string, UserSession> = {
  superadmin: { role: 'superadmin', userId: 'u-admin', displayName: 'Admin Sistema' },
  director: { role: 'director', userId: 'u-director-1', displayName: 'Dir Roberto Alves' },
  professor: { role: 'professor', userId: 'u-teacher-1', displayName: 'Prof Ana Silva' },
  student: { role: 'student', userId: 's-1', displayName: 'Julia Martins' },
}

export const seedData: AppData = {
  classes: [
    {
      id: 'c-1',
      name: 'Seminario Matutino A',
      teacherId: 'u-teacher-1',
      teacherName: 'Prof Ana Silva',
      schedule: 'Dom 06:00',
      active: true,
    },
    {
      id: 'c-2',
      name: 'Seminario Vespertino B',
      teacherId: 'u-teacher-2',
      teacherName: 'Prof Carlos Souza',
      schedule: 'Dom 14:00',
      active: true,
    },
  ],
  teachers: [
    { id: 'u-teacher-1', displayName: 'Prof Ana Silva', email: 'professor@seminario.com', active: true },
    { id: 'u-teacher-2', displayName: 'Prof Carlos Souza', email: 'carlos@seminario.com', active: true },
  ],
  students: [
    { id: 's-1', firstName: 'Julia', lastName: 'Martins', classId: 'c-1', active: true },
    { id: 's-2', firstName: 'Pedro', lastName: 'Santos', classId: 'c-1', active: true },
    { id: 's-3', firstName: 'Lucia', lastName: 'Araujo', classId: 'c-1', active: true },
    { id: 's-4', firstName: 'Lucas', lastName: 'Oliveira', classId: 'c-2', active: true },
  ],
  achievements: [
    {
      id: 'a-1',
      title: 'Leitura Genesis',
      description: 'Concluiu a leitura de Genesis.',
      category: 'Leitura',
      collection: 'Velho Testamento',
      color: 'clay',
      icon: 'GN',
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
  ],
  studentAchievements: [
    {
      id: 'sa-1',
      studentId: 's-1',
      achievementId: 'a-1',
      grantedBy: 'Prof Ana Silva',
      grantedByRole: 'professor',
      grantedAt: thisMonth(1),
      status: 'granted',
    },
    {
      id: 'sa-2',
      studentId: 's-1',
      achievementId: 'a-3',
      grantedBy: 'Prof Ana Silva',
      grantedByRole: 'professor',
      grantedAt: thisMonth(5),
      status: 'granted',
    },
    {
      id: 'sa-3',
      studentId: 's-2',
      achievementId: 'a-1',
      grantedBy: 'Prof Ana Silva',
      grantedByRole: 'professor',
      grantedAt: thisMonth(2),
      status: 'granted',
    },
  ],
  invites: [
    {
      id: 'i-1',
      email: 'novo.aluno@email.com',
      classId: 'c-1',
      status: 'pending',
      token: 'INV-7K2A',
      createdBy: 'Prof Ana Silva',
      createdAt: thisMonth(10, 8),
    },
    {
      id: 'i-2',
      email: 'aluno.antigo@email.com',
      classId: 'c-1',
      status: 'accepted',
      token: 'INV-91QF',
      createdBy: 'Prof Ana Silva',
      createdAt: lastMonth(28),
      acceptedAt: thisMonth(1, 9),
    },
  ],
  auditLogs: [
    {
      id: 'log-1',
      action: 'grant_achievement',
      actor: 'Prof Ana Silva',
      actorRole: 'professor',
      target: 'Julia Martins',
      createdAt: thisMonth(5),
      details: 'Concedeu Presenca Perfeita.',
    },
    {
      id: 'log-2',
      action: 'invite_created',
      actor: 'Prof Ana Silva',
      actorRole: 'professor',
      target: 'novo.aluno@email.com',
      createdAt: thisMonth(10, 8),
      details: 'Criou convite para Seminario Matutino A.',
    },
  ],
}
