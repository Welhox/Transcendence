import prisma from '../prisma.js'
import bcrypt from 'bcryptjs'
import { authenticate } from '../middleware/authenticate.js'

export async function settingsRoutes(fastify, options) {

	const rateLimitConfig = {
		config: {
			rateLimit: {
				max: 1,
				timeWindow: '1 hour',
				keyGenerator: (request) => request.user?.id?.toString() || request.ip,
			}
		}
	};

	/* Change Email */
	fastify.route({
		method: 'PUT',
		url: '/user/email',
		preHandler: authenticate,
		...rateLimitConfig,
		handler: async (request, reply) => {

		const { newValue, currentPassword } = request.body;
		const userId = request.user?.id;

		if (!userId) return reply.status(401).send({ message: 'Unauthorized' });

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) return reply.status(404).send({ message: 'User not found' });

		const isValid = await bcrypt.compare(currentPassword, user.password);
		if (!isValid) return reply.status(403).send({ message: 'Invalid current password' });

		try {
			await prisma.user.update({
				where: { id: userId },
				data: { email: newValue.trim(),
						isActivated: false,
				 },
			});

			// TRIGGER USER EMAIL VERIFICATION

			reply.send({ message: 'Email updated' });
		} catch (error) {
			reply.status(400).send({ message: 'Email already in use or invalid' });
		}
	}
	});

	/* Change password */
	fastify.route({
		method: 'PUT',
		url: '/user/password',
		preHandler: authenticate,
		...rateLimitConfig,
		handler: async (request, reply) => {

		const { newValue, currentPassword } = request.body;
		const userId = request.user?.id;

		if (!userId) return reply.status(401).send({ message: 'Unauthorized' });

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) return reply.status(404).send({ message: 'User not found' });

		const isValid = await bcrypt.compare(currentPassword, user.password);
		if (!isValid) return reply.status(403).send({ message: 'Invalid current password' });

		const hashed = await bcrypt.hash(newValue.trim(), 10);

		await prisma.user.update({
			where: { id: userId },
			data: { password: hashed },
		});

		reply.send({ message: 'Password updated' });
	}
	});

	fastify.post('/user/language', { preHandler: authenticate }, async (request, reply) => {
		const { language } = request.body;
		const userId = request.user?.id;

		if (!userId) {
			return reply.status(401).send({ error: 'Unauthorized' });
		}

		if (!language || !['en', 'fi', 'se'].includes(language)) {
			return reply.status(400).send({ error: 'Invalid language code' });
		}

		try {
			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: { language },
			});

			reply.send({ language: updatedUser.language });
		} catch (error) {
			request.log.error();
			reply.status(500).send({ error: 'Failed to update language' });
		}
	});
}