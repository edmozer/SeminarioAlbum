import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Seed Users (Staff)
  const userAdmin = await prisma.user.upsert({
    where: { email: 'admin@seminario.com' },
    update: {},
    create: {
      id: 'u-admin',
      email: 'admin@seminario.com',
      name: 'Admin Sistema',
      role: 'superadmin',
    },
  })

  const userDirector = await prisma.user.upsert({
    where: { email: 'director@seminario.com' },
    update: {},
    create: {
      id: 'u-director-1',
      email: 'director@seminario.com',
      name: 'Dir Roberto Alves',
      role: 'director',
    },
  })

  const userProfessor1 = await prisma.user.upsert({
    where: { email: 'professor@seminario.com' },
    update: {},
    create: {
      id: 'u-teacher-1',
      email: 'professor@seminario.com',
      name: 'Prof Ana Silva',
      role: 'professor',
    },
  })

  // Add another professor
  const userProfessor2 = await prisma.user.upsert({
    where: { email: 'carlos@seminario.com' },
    update: {},
    create: {
      id: 'u-teacher-2',
      email: 'carlos@seminario.com',
      name: 'Prof Carlos Souza',
      role: 'professor',
    },
  })

  // Seed Classes
  const class1 = await prisma.class.upsert({
    where: { id: 'c-1' },
    update: {},
    create: {
      id: 'c-1',
      name: 'Seminario Matutino A',
      teacherId: 'u-teacher-1',
      schedule: 'Dom 06:00',
      active: true,
    },
  })

  const class2 = await prisma.class.upsert({
    where: { id: 'c-2' },
    update: {},
    create: {
      id: 'c-2',
      name: 'Seminario Vespertino B',
      teacherId: 'u-teacher-2',
      schedule: 'Dom 14:00',
      active: true,
    },
  })

  // Seed Students
  const student1 = await prisma.student.upsert({
    where: { id: 's-1' },
    update: { email: 'student@seminario.com' },
    create: {
      id: 's-1',
      firstName: 'Julia',
      lastName: 'Martins',
      email: 'student@seminario.com',
      classId: 'c-1',
      active: true,
    },
  })

  const student2 = await prisma.student.upsert({
    where: { id: 's-2' },
    update: {},
    create: {
      id: 's-2',
      firstName: 'Pedro',
      lastName: 'Santos',
      classId: 'c-1',
      active: true,
    },
  })

  const student3 = await prisma.student.upsert({
    where: { id: 's-3' },
    update: {},
    create: {
      id: 's-3',
      firstName: 'Lucia',
      lastName: 'Araujo',
      classId: 'c-1',
      active: true,
    },
  })

  const student4 = await prisma.student.upsert({
    where: { id: 's-4' },
    update: {},
    create: {
      id: 's-4',
      firstName: 'Lucas',
      lastName: 'Oliveira',
      classId: 'c-2',
      active: true,
    },
  })

  // Seed Achievements
  const achievements = [
    {
      id: 'a-1',
      title: 'Leitura Genesis',
      description: 'Concluiu a leitura de Genesis.',
      category: 'Leitura',
      collection: 'Velho Testamento',
      color: 'clay',
      icon: 'GN',
    },
    {
      id: 'a-2',
      title: 'Leitura Exodo',
      description: 'Concluiu a leitura de Exodo.',
      category: 'Leitura',
      collection: 'Velho Testamento',
      color: 'clay',
      icon: 'EX',
    },
    {
      id: 'a-3',
      title: 'Presenca Perfeita',
      description: '100 por cento de presenca no mes.',
      category: 'Frequencia',
      collection: 'Presenca',
      color: 'teal',
      icon: 'PR',
    },
    {
      id: 'a-4',
      title: 'Memorizacao 1',
      description: 'Concluiu desafio de memorizacao.',
      category: 'Memorizacao',
      collection: 'Desafios',
      color: 'gold',
      icon: 'MM',
    },
    {
      id: 'a-5',
      title: 'Pentateuco Completo',
      description: 'Completou todo o bloco do Pentateuco.',
      category: 'Modulo',
      collection: 'Velho Testamento',
      color: 'navy',
      icon: 'PT',
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
    },
  ]

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        title: a.title,
        description: a.description,
        category: a.category,
        collection: a.collection,
        color: a.color,
        icon: a.icon,
        imageUrl: a.imageUrl,
        active: true,
      },
    })
  }

  // Seed Student Achievements (Grants)
  // We remove existing to avoid duplicates on re-run if ids match, but upsert is safer
  // Assuming grants are immutable once created for seed
  
  const grant1 = await prisma.studentAchievement.upsert({
    where: { id: 'sa-1' },
    update: {},
    create: {
      id: 'sa-1',
      studentId: 's-1',
      achievementId: 'a-1',
      grantedBy: 'Prof Ana Silva',
      grantedByRole: 'professor',
      status: 'granted',
    },
  })

  const grant2 = await prisma.studentAchievement.upsert({
    where: { id: 'sa-2' },
    update: {},
    create: {
      id: 'sa-2',
      studentId: 's-1',
      achievementId: 'a-3',
      grantedBy: 'Prof Ana Silva',
      grantedByRole: 'professor',
      status: 'granted',
    },
  })

  const grant3 = await prisma.studentAchievement.upsert({
    where: { id: 'sa-3' },
    update: {},
    create: {
      id: 'sa-3',
      studentId: 's-2',
      achievementId: 'a-1',
      grantedBy: 'Prof Ana Silva',
      grantedByRole: 'professor',
      status: 'granted',
    },
  })

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
