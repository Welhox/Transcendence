import Fastify from 'fastify';

const fastify = Fastify();

try {
  await fastify.listen({ port: 3333 });
  console.log('✅ Backend booted successfully');
  await fastify.close();
  process.exit(0);
} catch (err) {
  console.error('❌ Backend failed to start', err);
  process.exit(1);
}
