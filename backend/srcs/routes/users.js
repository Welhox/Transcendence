//import the prisma database
import prisma from '../prisma.js'
//import the hashing functions
import bcryptjs from 'bcryptjs'

export default async function userRoutes(fastify, options) {
	fastify.get('/users/all', async (req, reply) => {
	  const users = await prisma.user.findMany({
		select: { id: true, username: true, email: true }, // Don't send passwords
	  })
	  reply.send(users)
	})
  
	fastify.post('/users', async (req, reply) => {
	  const { username, email, password } = req.body
	  const hashedPassword = await bcryptjs.hash(password, 10)
  
	  try {
		const user = await prisma.user.create({
		  data: { username, email, password: hashedPassword },
		})
		reply.code(201).send({
		  id: user.id,
		  username: user.username,
		  email: user.email,
		})
	  } catch (err) {
		if (err.code === 'P2002') {
		  return reply.code(409).send({ error: 'Username or email already exists' })
		}
		reply.code(500).send({ error: 'Internal server error' })
	  }
	})
  }
