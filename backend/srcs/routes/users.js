import prisma from '../prisma.js'
import bcryptjs from 'bcryptjs'
import { userSchemas } from '../schemas/userSchemas.js'
import { authenticate } from '../middleware/authenticate.js'
import { handleOtp } from '../handleOtp.js';

export async function userRoutes(fastify, options) {

	const rateLimitConfig = {
		config: {
			rateLimit: {
				max: 5,
				timeWindow: '1 minute',
				keyGenerator: (request) => request.user?.id?.toString() || request.ip,
			}
		}
	};

//####################################################################################################################################

	// login user
	fastify.post('/users/login', { schema: userSchemas.loginUserSchema, ...rateLimitConfig }, async (req, reply) => {
		try {
		const { username, password } = req.body

		// Find user by username
		const user = await prisma.user.findUnique({
		  where: { username },
		})
		// if user not found then wait for a small time and then return error
		if (!user) {
			await new Promise(resolve => setTimeout(resolve, 100));
		  	return reply.code(401).send({ error: 'Invalid username or password' }) 
		}
		// Compare plain password with hashed one, if invalid password, then return same error
		// again with a small wait to mitigate timed attacks
		const isPasswordValid = await bcryptjs.compare(password, user.password)
		if (!isPasswordValid) {
			await new Promise(resolve => setTimeout(resolve, 100));
		  	return reply.code(401).send({ error: 'Invalid username or password' })
		}
		//if mfa is activated for the user, then generate and send a otp to be validated
		//also send a token, which dose not give access, but in order to validate later that
		//login had been successfull.
		if (user.mfaInUse === true) {
			try
			{
				//make and send OTP to the matchin email
				await handleOtp(user.email)
				const otpToken = fastify.jwt.sign({
						id: user.id,
						email: user.email,
					},{expiresIn: '5min',})
				//set a otp token to the user and reply so that frontend knows to redirect to OTP page.
				reply.setCookie('otpToken', otpToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'strict',
					path: '/',
					maxAge: 5 * 60,
				})
				return reply.code(200).send({ message: 'MFA still required', mfaRequired: true, language: user.language || 'en' })
			} catch(error) {return reply.code(401).send({ error: 'Invalid email for mfa' })}
		}
		//credentials are valid, so we can create a JWT token
		const token = fastify.jwt.sign({
			id: user.id,
			username: user.username,
			},{expiresIn: '1h',  /* token expiration time */ });
		await prisma.user.update({
			where: { id: user.id },
			data: { isOnline: true },
		});
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
		return reply.code(200).send({message: 'Login successful', language: user.language || 'en' });
		} catch (error) {return reply.code(500).send({ error: 'Internal server error' });}
	});

//####################################################################################################################################

	fastify.post('/users/logout', { schema: userSchemas.logoutSchema,  preHandler: authenticate } , async (req, reply) => {
		const userId = req.user.id;
		try {
			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: { isOnline: false },
			});
	
			return reply
			.clearCookie('token', { path: '/' }) // tells the browser to delete the cookie, path should match the path used in .setCookie
			.send({ message: 'Logged out' });

		} catch (error) {
			if (err.code === 'P2025')
				return reply.code(404).send({ error: 'User not found' });
			return reply.code(500).send({ error: 'Internal server error' });
		}		
	});

//####################################################################################################################################

	//route to fetch all users - passwords
	fastify.get('/users/all', { schema: userSchemas.usersBaseInfoSchema }, async (req, reply) => {
	  const users = await prisma.user.findMany({
		select: { id: true, username: true, email: true },
	  })
	  reply.send(users)
	})
  
//####################################################################################################################################

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

//####################################################################################################################################	

	// route to insert a user into the database
	fastify.post('/users/register', { schema: userSchemas.registerUserSchema, ...rateLimitConfig }, async (req, reply) => {
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

//####################################################################################################################################

	// route to delete a user from the database
	fastify.delete('/users/delete/:id', { schema: userSchemas.deleteUserSchema, preHandler: authenticate }, async (req, reply) => {
	  const { id } = req.params
	  const user = req.user

	  if (!user || user.id !== Number(id)) {
		return reply.status(403).send({ error: 'Forbidden' });
	  }

	  console.log('Deleting user with ID:', id)
	  try {

		// manually disconnects user from all friendships since Cascade is not supported

		await prisma.user.update({
			where: { id: user.id },
			data: {
				friends: {
					disconnect: user.friends,
				},
				friendOf: {
					disconnect: user.friendOf,
				},
			},
		})

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

//####################################################################################################################################

	// axios doesnt support sending a body in delete request in all browsers, hence post:
	fastify.post('/users/delete/:id', { schema: userSchemas.deleteUserSchemaPost, preHandler: authenticate }, async (req, reply) => {
		const { id } = req.params
		const { password } = req.body
		const user = req.user
  
		if (!user || user.id !== Number(id)) {
		  return reply.status(403).send({ error: 'Forbidden' });
		}
  
		console.log('Deleting user with ID:', id)

		try {
			const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

			if (!dbUser) {
				return reply.code(404).send({ error: 'User not found' });
			}

			const isMatch = await bcryptjs.compare(password, dbUser.password);
			if (!isMatch) {
				return reply.code(401).send({ error: 'Incorrect password' });
			}

			reply.clearCookie('token', { path: '/' });
  
			await prisma.user.update({
				where: { id: user.id },
				data: {
					friends: {
						disconnect: user.friends,
					},
					friendOf: {
						disconnect: user.friendOf,
					},
				},
			})
	
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

//####################################################################################################################################

	// get user information with id (username, id, email)
	fastify.get('/users/id', { schema: userSchemas.getUserByIdSchema, preHandler: authenticate }, async (req, reply) => {
		const { id } = req.query
		const user = await prisma.user.findUnique({
		  where: { id: Number(id) },
		  select: { id: true, username: true, email: true, isOnline: true },
		})
		if (!user) {
		  return reply.code(404).send({ error: 'User not found' })
		}
		reply.send(user)
	  })

//####################################################################################################################################

	  	// get user email verification information from JWT (username, id, email, emailVerified)
	fastify.get('/users/emailStatus', { schema: userSchemas.getEmailStatusSchema, preHandler: authenticate }, async (req, reply) => {
		const userId = req.user?.id; 
		console.log('User ID from JWT:', userId);
		// if (typeof userId !== 'number') {
		// return reply.code(400).send({ error: 'Invalid or missing user ID' });
		// }
		const user = await prisma.user.findUnique({
		  where: { id: Number(userId) },
		  select: { email: true, emailVerified: true },
		})
		if (!user) {
		  return reply.code(404).send({ error: 'User not found' })
		}
		reply.send(user)
	  })

//####################################################################################################################################

	// get user information with username (username, id, email)
	fastify.get('/users/username', { schema: userSchemas.getUserByUsernameSchema, preHandler: authenticate }, async (req, reply) => {
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

//####################################################################################################################################

	// get user information with email (username, id, email)
	fastify.get('/users/email', { schema: userSchemas.getUserByEmailSchema, preHandler: authenticate }, async (req, reply) => {
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

//####################################################################################################################################

	// change isActivated = true once MFA is ready
	// is using queryRaw because Prisma 6 doesn't support the cleaner version I originally went for (requires Prisma < 5)
	fastify.get('/users/search', { schema: userSchemas.searchUsersSchema, preHandler: authenticate } , async (request, reply) => {
		const { query, excludeUserId } = request.query;

		if (!query || !/^[a-zA-Z0-9]+$/.test(query)) {
			return reply.status(400).send([]);
		}

		const users = await prisma.$queryRaw`
		   SELECT id, username
		   FROM User
		   WHERE isActivated = false
		   	AND id != ${Number(excludeUserId) || -1}
		    AND LOWER(username) LIKE ${query.toLowerCase() + '%'}
			LIMIT 20;
		`;

		return users;
	});

//####################################################################################################################################

	fastify.get('/users/:id/friends', { schema: userSchemas.getUserFriendsByIdSchema , preHandler: authenticate } , async (request, reply) => {
		const userId = parseInt(request.params.id, 10);
		if (isNaN(userId)) {
			return reply.code(400).send({ error: 'Invalid user ID' });
		}

		try {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				include: {
					friends: {
						select: { id: true, username: true, isOnline: true },
					},
					friendOf: {
						select: { id: true, username: true, isOnline: true },
					},
				},
			});

			if (!user) {
				return reply.code(404).send({ error: 'User not found' });
			}

			// combine both directions of relationship, avoiding duplicates
			const allFriendsMap = new Map();
			[...user.friends, ...user.friendOf].forEach(friend => {
				allFriendsMap.set(friend.id, friend);
			});

			const uniqueFriends = Array.from(allFriendsMap.values());

			return reply.send(uniqueFriends);

		} catch (error) {
			console.error(error);
			return reply.code(500).send({ error: 'Server error' });
		}
	});

//####################################################################################################################################

	fastify.get('/users/:id/requests', { schema: userSchemas.getFriendRequestByIdSchema, preHandler: authenticate } , async (request, reply) => {
		const userId = parseInt(request.params.id, 10);
		const requests = await prisma.friendRequest.findMany({
			where: {
				receiverId: userId,
				status: 'pending',
			},
			include: {
				sender: { select: { id: true, username: true} },
			},
		});

		reply.send(
			requests.map(req => ({
				id: req.id,
				senderId: req.sender.id,
				username: req.sender.username,
			}))
		);
	});

//####################################################################################################################################

  //Route to get the settings of the users using JWT token
  fastify.get('/users/settings', { schema: userSchemas.getUserSettingsSchema, preHandler: authenticate }, async (request, reply) => {
	const userId = request.user?.id;
  
	if (typeof userId !== 'number') {
	  return reply.code(400).send({ error: 'Invalid or missing user ID' });
	}
  
	try {
	  const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { mfaInUse: true, email: true, language: true}
	  });
  
	  if (!user) {
		return reply.code(404).send({ error: 'User not found' });
	  }
  
	  reply.send(user);
	} catch (err) {
	  request.log.error(err);
	  reply.code(500).send({ error: 'Failed to retrieve settings' });
	}
  });
  
//####################################################################################################################################

  //to update the mfaInUse boolean, using the JWT TOKEN
  fastify.post('/auth/mfa', { schema: userSchemas.updateMfaSchema, preHandler: authenticate }, async (request, reply) => {
	const { mfaInUse } = request.body;
  
	// This should get the information from the JWT token
	const userId = request.user?.id;
  
	if (typeof userId !== 'number' || typeof mfaInUse !== 'boolean') {
	  return reply.code(400).send({ error: 'Invalid input or missing authentication' });
	}
  
	try {
	  const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: { mfaInUse },
	  });
  
	  reply.send({ message: 'MFA status updated', mfaInUse: updatedUser.mfaInUse });
	} catch (err) {
	  fastify.log.error(err);
	  return reply.code(500).send({ error: 'Failed to update MFA status' });
	}
  });

//####################################################################################################################################

    //to update the email activation status, using the JWT TOKEN
  fastify.post('/users/emailActivation', { schema: userSchemas.updateEmailActivationSchema, preHandler: authenticate }, async (request, reply) => {
	const { emailVerified } = request.body;
  
	// This should get the information from the JWT token
	const userId = request.user?.id;
  
	if (typeof userId !== 'number' || typeof emailVerified !== 'boolean') {
	  return reply.code(400).send({ error: 'Invalid input or missing authentication' });
	}
  
	try {
	  const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: { emailVerified },
	  });
  
	  reply.send({ message: 'Email activation status updated', emailVerified: updatedUser.emailVerified });
	} catch (err) {
	  fastify.log.error(err);
	  return reply.code(500).send({ error: 'Failed to update email verification status' });
	}
  });
}

//####################################################################################################################################