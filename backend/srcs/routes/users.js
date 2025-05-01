//import the prisma database
import prisma from '../prisma.js'
//import the hashing functions
import bcryptjs from 'bcryptjs'
//import the schema for the user
import { deleteUserSchema, getUserByEmailSchema, getUserByUsernameSchema, getUserByIdSchema, registerUserSchema, loginUserSchema } from '../schemas/userSchemas.js'
import { authenticate } from '../middleware/authenticate.js'


export async function userRoutes(fastify, options) {

	// login user
	fastify.post('/users/login', {schema:loginUserSchema}, async (req, reply) => {
		try {
		const { username, password } = req.body
	  
		// Check if username and password are provided
		if (!username || !password) {
		  return reply.code(400).send({ error: 'Username and password are required' })
		}

		// Find user by username
		const user = await prisma.user.findUnique({
		  where: { username },
		})
		// if user not found then return  error
		if (!user) {
			//add a small wait to mitigate timed attacks
			await new Promise(resolve => setTimeout(resolve, 100));
			// return 401 for invalid credentials
		  return reply.code(401).send({ error: 'Invalid username or password' }) 
		}
	  
		// Compare plain password with hashed one
		const isPasswordValid = await bcryptjs.compare(password, user.password)
		//if invalid password, then return same error
		if (!isPasswordValid) {
			//add a small wait to mitigate timed attacks
			await new Promise(resolve => setTimeout(resolve, 100));
			// return 401 for invalid credentials
		  return reply.code(401).send({ error: 'Invalid username or password' })
		}
		//credentials are valid, so we can create a JWT token
		const token = fastify.jwt.sign(
			{
			id: user.id,
			username: user.username,
			},
			{
				expiresIn: '1h', // token expiration time
			}
		);

		// store JWT in cookie (httpOnly)
		// httpOnly means the cookie cannot be accessed via JavaScript, which helps mitigate XSS attacks
		// secure means the cookie will only be sent over HTTPS connections
		reply.setCookie('token', token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict', // means the cookie won’t be sent if someone embeds your site in an iframe or from another domain 
				path: '/',
				maxAge: 60 * 60, // 1 hour in seconds, same as JWT expiration
		})
		// send response with without token (token is in the cookie)
		return reply.code(200).send({message: 'Login successful'});
		} catch (error) {
			console.error('Error during login:', error);
			return reply.code(500).send({ error: 'Internal server error' });
		}
	});

	// route to check if user is logged in
	//should be redundant with the authenticate middleware

	// fastify.get('/users/session', async  (req, reply) => {

	// 	try {
	// 		const token = req.cookies.token

	// 		if (!token) {
	// 			return reply.code(299).send({ error: 'Not authenticated' });
	// 		}
	// 		const decoded = fastify.jwt.verify(token);
	// 		return reply.code(200).send({
	// 			message: 'Session valid',
	// 			token,
	// 		});
	// 	} catch (error) {
	// 		return reply.code(401).send({ error: 'Invalid or expired session' });
	// 	}
	// });

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
	try {
	  // Get users along with associated OTP information
	  const users = await prisma.user.findMany({
		include: {
		  OTP: true,  // Include the OTPs related to each user
		},
	  });
  
	  // Send the response with user data along with OTPs
	  reply.send(users);
	} catch (error) {
	  console.error('Error retrieving users and OTPs:', error);
	  reply.status(500).send('Error retrieving users and OTPs');
	}
  });

	

	// route to insert a user into the database
	fastify.post('/users/register', {schema: registerUserSchema}, async (req, reply) => {
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

	// route to delete a user from the database
	fastify.delete('/users/delete/:id', { schema: deleteUserSchema, preHandler: authenticate }, async (req, reply) => {
	  const { id } = req.params
	  console.log('Deleting user with ID:', id)
	  try {
		await prisma.user.delete({
		  where: { id: Number(id) },
		})
		return reply.code(200).send({ message: 'User deleted successfully' })
	  } catch (err) {
		console.log('Error deleting user:', err);
		if (err.code === 'P2025') {
		  return reply.code(404).send({ error: 'User not found' }) //should maybe be 409
		}
		reply.code(500).send({ error: 'Internal server error' })
	  }
	})

	// get user information with id (username, id, email)
	fastify.get('/users/id', { schema: getUserByIdSchema, preHandler: authenticate }, async (req, reply) => {
		const { id } = req.query
		const user = await prisma.user.findUnique({
		  where: { id: Number(id) },
		  select: { id: true, username: true, email: true },
		})
		if (!user) {
		  return reply.code(404).send({ error: 'User not found' })
		}
		reply.send(user)
	  })

	// get user information with username (username, id, email)
	fastify.get('/users/username', { schema: getUserByUsernameSchema, preHandler: authenticate }, async (req, reply) => {
		const { username } = req.query
		const user = await prisma.user.findUnique({
		  where: { username: username },
		  select: { id: true, username: true, email: true },

		})
		if (!user) {
		  return reply.code(404).send({ error: 'User not found' })
		}
		reply.send(user)
	  })

	// get user information with email (username, id, email)
	fastify.get('/users/email', { schema: getUserByEmailSchema, preHandler: authenticate }, async (req, reply) => {
		const { email } = req.query
		const user = await prisma.user.findUnique({
		  where: { email: email },
		  select: { id: true, username: true, email: true },
		})
		if (!user) {
		  return reply.code(404).send({ error: 'User not found' })
		}
		reply.send(user)
	  })

	//example of accessing this API from the frontend (React/Typescript)
/* 	  const response = await fetch(`/users/email?email=${encodeURIComponent(userEmail)}`, {
		method: 'GET'
	  });
	  const data = await response.json(); */
  }

