//import the prisma database
import prisma from '../prisma.js'
import { authenticate } from '../middleware/authenticate.js'

export async function statsRoute(fastify, options) {  

	fastify.get('/stats/:userId', { preHandler: authenticate } , async (request, reply) => {
		const { userId } = request.params;

		const numericUserId = parseInt(userId, 10);
		if (isNaN(numericUserId)) {
			console.error('Invalid userId:', userId);
			return reply.status(400).send({ message: 'Invalid user ID' });
		}

		try {
			const user = await prisma.user.findUnique({
				where: { id: parseInt(numericUserId) },
				select: {
					wins: true,
					losses: true,
					matchesAsPlayer: {
						select: {
							date: true,
							result: true,
							opponent: {
								select: {
									username: true,
								},
							},
						},
					},
					matchesAsOpponent : {
						select: {
							date: true,
							result: true,
							player: {
								select: {
									username: true,
								},
							},
						},
					},
				},
			});

			if (!user) {
				return reply.status(404).send({ message: 'User not found' });
			}

			const combinedMatches = [
				...user.matchesAsPlayer.map(m => ({
					date: m.date,
					result: m.result === 'win' ? 'Win' : 'Loss',
					opponent: m.opponent.username,
				})),
				...user.matchesAsOpponent.map(m => ({
					date: m.date,
					result: m.result === 'win' ? 'Loss' : 'Win',
					opponent: m.player.username,
				})),
			];

			const seen = new Set();
			const dedupedMatches = combinedMatches
				.filter(m => {
					const key = m.date.toISOString() + m.opponent;
					if (seen.has(key)) return false;
					seen.add(key);
					return true; })
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); //descending

			const stats = {
				totalWins: user.wins,
				totalLosses: user.losses,
				totalTournamentsWon: 0, // optional if tournaments are tracked separately; fix this later
				matchHistory: dedupedMatches,
			};

			console.log('Succesful stats request:', stats);
			return stats;

		} catch (error) {
			console.error(error);
			return reply.status(500).send({ message: 'Server error' });
		}
	});
}