import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()
const fastify = Fastify({
  logger: true
})

fastify.register(cors, {
  origin: true // Allow all origins for dev
})

// Schema for login body
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().optional() // Optional for now as requested
})

// Login endpoint
fastify.post('/api/login', async (request, reply) => {
  const result = loginSchema.safeParse(request.body)
  
  if (!result.success) {
    return reply.status(400).send({ error: 'Invalid input', details: result.error })
  }

  const { email } = result.data

  // Try to find user in Staff table
  let user = await prisma.user.findUnique({
    where: { email }
  })

  if (user) {
    return reply.send({
      token: 'jwt-token-' + user.id,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.name,
        role: user.role
      }
    })
  }

  // Try to find student
  const student = await prisma.student.findUnique({
    where: { email }
  })

  if (student) {
    return reply.send({
      token: 'jwt-token-' + student.id,
      user: {
        id: student.id,
        email: student.email,
        displayName: `${student.firstName} ${student.lastName}`,
        role: 'student'
      }
    })
  }

  // If not found in DB, return error or mock?
  // Since we seeded DB, let's return error for unknown users to be "real".
  return reply.status(401).send({ error: 'User not found' })
})

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok' }
})

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server running at http://localhost:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
