
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { userRoutes } from './routes/users.js'
import { sessionRoute } from './routes/session.js'
import { statsRoute } from './routes/stats.js'
import { otpRoutes } from './routes/otp.js'
import { friendRoutes } from './routes/friends.js'
import seedUsers from './seed.js'
import fastifyJwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import dotenv from 'dotenv';
const fastify = Fastify({ logger: true})

dotenv.config({ path: './.env' });

fastify.addHook('onSend', async (request, reply, payload) => { // tells fastify that all content type is JSON by default
	reply.type('application/json');
	return payload;
});

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

    fastify.register(fastifyJwt, {
      secret: process.env.JWT_SECRET,
      cookie: {
        cookieName: 'token',
        signed: false,
      },
    });

    //connect the routes to the backend
    fastify.register(userRoutes);
	fastify.register(sessionRoute);
	fastify.register(statsRoute);
    fastify.register(otpRoutes);
	fastify.register(friendRoutes);
    //add a seed of 5 users to the db
    try {
    await seedUsers()
    } catch (err) {
      console.warn('⚠️ Seeding skipped or failed gracefully:', err.message);
    }

    fastify.get('/', async (request, reply) => {
      return { hello: 'world' };
    });
    
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    console.log('Catch activated!!')
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
