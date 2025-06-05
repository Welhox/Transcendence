
import { authenticateOptional } from '../middleware/authenticateOptional.js'
import prisma from '../prisma.js'
import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.resolve('assets');

export async function sessionRoute(fastify, options) {

	// for session verification; returns username and user ID
	fastify.get('/session/user', {
		config: {
			rateLimit: false,
		},
		handler: async (req, reply) => {
		await authenticateOptional(req, reply);

		if (!req.user || !req.user.id || !req.user.username) {
			return reply.send(null);
		}

		const { id, username } = req.user;

		try {
			const user = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: { profilePic: true, email: true },
			});

			let profilePic = '/assets/default_avatar.png';

			if (user?.profilePic) {
				const picName = path.basename(user.profilePic);
				const absolutePath = path.resolve(UPLOAD_DIR, picName);

				if (fs.existsSync(absolutePath)) {
					profilePic = `/assets/${picName}`;
				}
			}

			return reply.send({ id, username, profilePic, email: user?.email });
	
		} catch (error) {
			console.error('Session route failed:', error);
			return reply.code(500).send({ error: 'Internal server error' });
		}
	}
	});
}