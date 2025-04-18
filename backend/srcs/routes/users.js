//import the prisma database
import prisma from '../prisma.js'
//import the hashing functions
import bcryptjs from 'bcryptjs'


export async function userRoutes(fastify, options) {

	// login user
	fastify.post('/users/login', async (req, reply) => {
		const { username, password } = req.body
	  
		// Find user by username
		const user = await prisma.user.findUnique({
		  where: { username },
		})
		// if user not found then return  error
		if (!user) {
		  return reply.code(400).send({ error: 'Invalid username or password' }) //should probably be 401
		}
	  
		// Compare plain password with hashed one
		const isPasswordValid = await bcryptjs.compare(password, user.password)
		//if invalid password, then return same error
		if (!isPasswordValid) {
		  return reply.code(400).send({ error: 'Invalid username or password' }) //shuold probably be 401
		}
	  
		// Login success — optionally create JWT, etc
	    //reply.status(200).send({ message: 'Login successful' });
		// reply.send({
		//   message: 'Login successful',
		//   user: {
		// 	id: user.id,
		// 	username: user.username,
		// 	email: user.email,
		//   },
		// })

		const token = fastify.jwt.sign({
			sub: user.id,
			name: user.username,
		});

		// the insecure way:
		/* return reply.code(200).send({
			message: 'Login successful',
			token,
		}); */

		// new reply format to use httpOnly cookies
		return reply
			.setCookie('token', token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				path: '/',
				maxAge: 60 * 60,
			})
			.code(200)
			.send({ message: 'Login succesful' });
	});

	// route to check if user is logged in
	fastify.get('/users/session', async (req, reply) => {

		try {
			const token = req.cookies.token

			if (!token) {
				return reply.code(401).send({ error: 'Not authenticated' });
			}

			const decoded = fastify.jwt.verify(token);

			return reply.code(200).send({
				message: 'Session valid',
				token,
			});

		} catch (error) {
			return reply.code(401).send({ error: 'Invalid or expired session' });
		}
	});

	fastify.post('/users/logout', async (req, reply) => {
		reply.clearCookie('token', { // tells the browser to delete the cookie by setting an expired date
			path: '/', // this should match the path used in .setCookie
		});
		return reply.send({ message: 'Logged out' });
	});

	//route to fetch all users - passwords
	fastify.get('/users/all', async (req, reply) => {
	  const users = await prisma.user.findMany({
		select: { id: true, username: true, email: true },
	  })
	  reply.send(users)
	})
  
	//REMOVE FOR PRODUCTION!!
	fastify.get('/users/allInfo', async (req, reply) => {
		const users = await prisma.user.findMany()
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
