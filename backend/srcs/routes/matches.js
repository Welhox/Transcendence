import prisma from '../prisma.js';

export async function matchesRoute(fastify, options) {
  fastify.post('/matches', async (req, reply) => {
    const { player, opponent, winner, loser, leftScore, rightScore } = req.body;

    // Only store matches for registered users
    const playerUser = await prisma.user.findUnique({ where: { username: player } });
    const opponentUser = await prisma.user.findUnique({ where: { username: opponent } });

    // If either is a guest, skip storing (optional: you can store guest matches differently)
    if (!playerUser || !opponentUser) {
      return reply.code(200).send({ message: 'Match not stored (guest involved)' });
    }

    // Determine result for player
    const result = winner === player ? 'win' : 'loss';

    await prisma.match.create({
      data: {
        playerId: playerUser.id,
        opponentId: opponentUser.id,
        result,
        date: new Date(),
        leftScore,
        rightScore,
      },
    });

    return reply.code(201).send({ message: 'Match stored' });
  });
}