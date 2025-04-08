const fastify = require('fastify')({ logger: true });

const start = async () => {
  try {
    await fastify.register(require('@fastify/cors'), {
      origin: true
    });

    fastify.get('/', async (request, reply) => {
      return { hello: 'world' };
    });

    fastify.get('/app/data', async (request, reply) => {
      return { hello: 'Hello from the awesome backend!' };
    });

    await fastify.listen({ port: 3000 });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
