
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { userRoutes } from './routes/users.js'
import { refreshTokens } from './routes/refreshTokens.js'
import { pongStats } from './routes/pongStats.js'
import seedUsers from './seed.js'
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import dotenv from 'dotenv';
const fastify = Fastify({ logger: true})

dotenv.config({ path: './.env' });

const start = async () => {
  try {

	if (!process.env.JWT_SECRET) {
		throw new Error("❌ JWT_SECRET is not defined in the environment.");
	}

    await fastify.register(cors, {
      origin: true, // according to chatGPT this good for development, but we gotta figure out something else for the final product
      credentials: true,
    });

    fastify.register(cookie, {
      hook: 'onRequest', // makes cookies available earlier in lifecycle
    });

    fastify.register(jwt, {
      secret: process.env.JWT_SECRET,
	  cookie: {
		cookieName: 'refreshToken',
		signed: false,
	  }
    });

	fastify.decorate("authenticate", async function (request, reply) {
		try {
			await request.jwtVerify();
		} catch (error) {
			reply.code(401).send({ error: 'Unauthorized' });
		}
	});

    //connect the routes to the backend
    fastify.register(userRoutes)
	fastify.register(refreshTokens)
	fastify.register(pongStats)

    //add a seed of 5 users to the db
    await seedUsers()
    
    fastify.get('/', async (request, reply) => {
      return { hello: 'world' };
    });

	/* fastify.all('*', async (request, reply) => {
		console.log('🔍 Unmatched route:', request.method, request.url);
		reply.status(404).send({ message: 'Route not found' });
	  }); */
	  
    
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    console.log('Catch activated!!')
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
