//import the prisma database
import prisma from '../prisma.js'

export async function refreshTokens(fastify, options) {
	// updates refresh token for front
	fastify.get('/refresh', async (req, reply) => {
		try {
			const token = req.cookies.refreshToken;
			if (!token) return reply.code(299).send({ error: 'No refresh token' }); // check this error code

			const payload = fastify.jwt.verify(token);

			const user = await prisma.user.findUnique({
				where: { id: payload.id },
			});

			if (!user) return reply.code(404).send({ error: 'User not found' });

			const newAccessToken = fastify.jwt.sign(
				{ id: user.id, name: user.username },
				{ expiresIn: '15m' } // change back to 15m
			);

			reply.send({ accessToken: newAccessToken });
		
		} catch (error) {
			reply.code(299).send({ error: 'Invalid refresh token' }); // double check the error code
		}
	});
}