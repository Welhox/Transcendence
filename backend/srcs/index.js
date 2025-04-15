
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { userRoutes } from './routes/users.js'
import seedUsers from './seed.js'
const fastify = Fastify({ logger: true})

const start = async () => {
  try {

    await fastify.register(cors, {
      origin: true,
    });


    fastify.register(userRoutes)
    
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
