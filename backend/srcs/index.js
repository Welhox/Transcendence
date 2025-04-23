
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { userRoutes } from './routes/users.js'
import seedUsers from './seed.js'
import fastifyJwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
const fastify = Fastify({ logger: true})

const start = async () => {
  try {

    await fastify.register(cors, {
      origin: true, // according to chatGPT this good for development, but we gotta figure out something else for the final product
      credentials: true,
    });

    fastify.register(cookie, {
      hook: 'onRequest', // makes cookies available earlier in lifecycle
    });

    fastify.register(fastifyJwt, {
      secret: 'supersecretkey' // need to be changed for production -> env variable?
    });

    //connect the routes to the backend
    fastify.register(userRoutes)

    //add a seed of 5 users to the db
    await seedUsers()
    
    fastify.get('/', async (request, reply) => {
      return { hello: 'world' };
    });
    
    fastify.get('/app/data', async (request, reply) => {
      return { hello: 'Hello from the awesome backend!' };
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
