import prisma from "../prisma.js";
import { authenticate } from "../middleware/authenticate.js";
import { tournamentsSchemas } from "../schemas/tournamentsSchemas.js";

export async function tournamentsRoute(fastify, options) {
  // Create a tournament
  fastify.post(
    "/tournaments",
    {
      schema: tournamentsSchemas.createTournamentSchema,
      preHandler: authenticate,
    },
    async (req, reply) => {
      const { name, size } = req.body;
      //the schema already validates and returns 400 if not the right size
      // if (![4, 8, 16, 32].includes(size)) return reply.code(400).send({ error: 'Invalid size' });
      const tournament = await prisma.tournament.create({
        data: {
          name,
          size,
          createdById: req.user.id,
          status: "waiting",
        },
      });
      reply.send(tournament);
    }
  );

  // Register for a tournament
  fastify.post(
    "/tournaments/:id/register",
    { schema: tournamentsSchemas.registerTournamentSchema },
    async (req, reply) => {
      const { id } = req.params;
      const { userId, alias } = req.body;
      const participant = await prisma.tournamentParticipant.create({
        data: {
          tournamentId: Number(id),
          userId: userId || null,
          alias: alias || null,
        },
      });
      reply.send(participant);
    }
  );

  // Get all tournaments
  fastify.get(
    "/tournaments",
    { schema: tournamentsSchemas.getAllTournamentsSchema },
    async (req, reply) => {
      const tournaments = await prisma.tournament.findMany({
        include: { participants: true },
        orderBy: { createdAt: "desc" },
      });
      reply.send(tournaments);
    }
  );

  // Get tournament details (including participants and matches)
  fastify.get(
    "/tournaments/:id",
    { schema: tournamentsSchemas.getTournamentSchema },
    async (req, reply) => {
      const { id } = req.params;
      const tournament = await prisma.tournament.findUnique({
        where: { id: Number(id) },
        include: {
          participants: true,
          matches: true,
        },
      });
      reply.send(tournament);
    }
  );

  // TODO: Add endpoint to start tournament (randomize bracket, create matches)
}
