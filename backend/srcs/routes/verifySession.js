
import { authenticate } from '../middleware/authenticate.js'

export async function verifySession(fastify, options) {

	// for session verification; returns username and user ID
	fastify.get('/session/user', async (req, reply) => {
		await authenticate(req, reply);
		if (reply.sent) return;

		if (!req.user || !req.user.id || !req.user.username) {
			return reply.code(401).send({ error: 'Unauthorized' });
		}

		const { id, username } = req.user;
		return reply.send({ id, username });
	});
}