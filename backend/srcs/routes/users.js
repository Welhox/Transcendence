//import the prisma database
import prisma from '../prisma.js'
//import the hashing functions
import bcryptjs from 'bcryptjs'

export async function userRoutes(fastify, options) {


	// // login user
    // fastify.post('/users/login', async (request, reply) => {
    //   const { username, password } = request.body;
    //   db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, rows) => {
    //     if (err) {
    //       reply.status(500).send({ error: 'Database error' });
    //       return;
    //     }
    //     else if (!rows) {
    //       reply.status(400).send({ message: 'Invalid login credentials' });
    //       return;
    //     }
    //     reply.status(200).send({ message: 'Login successful' });
    //   });
    // });
	
	// login user
	fastify.post('/users/login', async (req, reply) => {
		const { username, password } = req.body
	  
		// 1. Find user by username (or email)
		const user = await prisma.user.findUnique({
		  where: { username },
		})
	  
		if (!user) {
		  return reply.code(400).send({ error: 'Invalid username or password' }) //should probably be 401
		}
	  
		// 2. Compare plain password with hashed one
		const isPasswordValid = await bcryptjs.compare(password, user.password)
	  
		if (!isPasswordValid) {
		  return reply.code(400).send({ error: 'Invalid username or password' }) //shuold probably be 401
		}
	  
		// 3. Login success — optionally create JWT, etc
	    reply.status(200).send({ message: 'Login successful' });
		// reply.send({
		//   message: 'Login successful',
		//   user: {
		// 	id: user.id,
		// 	username: user.username,
		// 	email: user.email,
		//   },
		// })
	  })

	//route to fetch all users - passwords
	fastify.get('/users/all', async (req, reply) => {
	  const users = await prisma.user.findMany({
		select: { id: true, username: true, email: true }, // Don't send passwords
	  })
	  reply.send(users)
	})
  
	// route to insert a user into the database
	fastify.post('/users/register', async (req, reply) => {
	  const { username, email, password } = req.body
	  const hashedPassword = await bcryptjs.hash(password, 10)
  
	  try {
		const user = await prisma.user.create({
		  data: { username, email, password: hashedPassword },
		})
		reply.code(200).send({ message: 'User added successfully' }) //should be 201
		// reply.send({ message: 'User added successfully' })
	  } catch (err) {
		if (err.code === 'P2002') {
		  return reply.code(400).send({ error: 'Username or email already exists' }) //should maybe be 409
		}
		reply.code(500).send({ error: 'Internal server error' })
	  }
	})
  }
