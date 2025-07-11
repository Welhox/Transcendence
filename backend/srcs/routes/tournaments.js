import prisma from "../prisma.js";
// import { authenticate } from "../middleware/authenticate.js";
import { tournamentsSchemas } from "../schemas/tournamentsSchemas.js";

/* TO-DO list for tournaments:
  need to make sure that too many tournaments cannot be created (some function for cleaning up database of old tournaments)
  same if the tournament creation is left undone */

export async function tournamentsRoute(fastify, _options) {
  // Create a tournament
  fastify.post("/tournaments/create",
    {
      schema: tournamentsSchemas.createTournamentSchema,
      // commented out in order to allow unauthenticated users to create tournaments
      // preHandler: authenticate,
    },
    async (req, reply) => {
      const { name, size, createdById, status } = req.body;
      console.log("Creating tournament with data:", req.body);
      //the schema already validates and returns 400 if not the right size
      // if (![4, 8, 16, 32].includes(size)) return reply.code(400).send({ error: 'Invalid size' });
      try {
      const tournament = await prisma.tournament.create({
        data: {
          name,
          size,
          createdById,
          status,
        },
      });
      reply.send(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      reply.code(500).send({ message: "Server error" });
    }}
  );

  // Register for a tournament
  fastify.post(
    "/tournaments/:id/register",
    { schema: tournamentsSchemas.registerTournamentSchema },
    async (req, reply) => {
      try {
      const { id } = req.params;
      const { userId, alias } = req.body;
      console.log("Registering for tournament with ID:", id, "User ID:", userId, "Alias:", alias);
      const tournament = await prisma.tournament.findUnique({
        where: { id: Number(id) },
        include: {
          participants: true,
        },
      });
      if (!tournament) {
        return reply.code(404).send({ message: "Tournament not found" });
      }
      if (tournament.participants.length >= tournament.size) {
        return reply.code(400).send({ message: "Tournament is full" });
      }
      if (!userId && !alias) {
        return reply.code(400).send({ message: "Either userId or alias is required" });
      }

      const participant = await prisma.tournamentParticipant.create({
        data: {
          tournamentId: Number(id),
          userId: userId || null,
          alias: alias || null,
        },
      });
      reply.send(participant);
    } catch (error) {
      console.error("Error registering for tournament:", error);
      reply.code(500).send({ message: "Server error" });
    }
    }
  );

  // Get all tournaments
  fastify.get(
    "/tournaments/all",
    { /* schema: tournamentsSchemas.getAllTournamentsSchema */ },
    async (req, reply) => {
      const tournaments = await prisma.tournament.findMany({
        include: { participants: true, tournamentMatches: true },
        orderBy: { createdAt: "desc" },
      });
      reply.send(tournaments);
    }
  );

  // Get tournament details (including participants and matches)
  fastify.get(
    "/tournaments/:id",
    { /* schema: tournamentsSchemas.getTournamentSchema */ },
    async (req, reply) => {
      const { id } = req.params;
      const tournament = await prisma.tournament.findUnique({
        where: { id: Number(id) },
        include: {
          participants: true,
          tournamentMatches: true,
        },
      });
      reply.send(tournament);
    }
  );

//###############################################################

  // Start a tournament
  fastify.post(
    "/tournaments/:id/start",
    { /* schema: tournamentsSchemas.startTournamentSchema */ },
    async (req, reply) => {
      const { id } = req.params;
      console.log("Starting tournament with ID:", id);
      try {
        const tournament = await prisma.tournament.findUnique({
          where: { id: Number(id) },
          include: { participants: true },
        });
        if (!tournament) {
          return reply.code(404).send({ message: "Tournament not found" });
        }
        if (tournament.status !== "waiting") {
          return reply.code(400).send({ message: "Tournament cannot be started" });
        }
        if (tournament.participants.length < tournament.size) {
          return reply.code(400).send({ message: "Not enough participants to start the tournament" });
        }
        //generate matches based on participants
        const participants = [...tournament.participants].sort(() => Math.random() - 0.5); // Shuffle participants
        const matches = [];

        for (let i = 0; i < participants.length; i += 2) {
            const p1 = participants[i];
            const p2 = participants[i + 1];
            if ((!p1.userId && !p1.alias) || (!p2.userId && !p2.alias)) {
              return reply.code(400).send({ message: "Participant must have a userId or alias" });
            }
              matches.push({
              round: 1,
              tournamentId: tournament.id,
              player1Id: p1.userId ?? null,
              player1Alias: p1.alias ?? null,
              player2Id: p2.userId ?? null,
              player2Alias: p2.alias ?? null,
            });
        }
        console.log("Generated matches:", matches);
        // Create matches in the database
        await prisma.TournamentMatch.createMany({
          data: matches,
        });
        // Update tournament status to 'in_progress'
        const updatedTournament = await prisma.tournament.update({
          where: { id: Number(id) },
          data: { status: "in_progress" },
        });
        console.log("Tournament started successfully:", updatedTournament);
        reply.send(updatedTournament);

      } catch (error) {
        console.error("Error starting tournament:", error);
        reply.code(500).send({ message: "Server error" });
      }
  });
  
  //##############################################################

  // update a tournament match
  fastify.post(
    "/tournaments/:id/match/:matchId/update",
    { /* schema: tournamentsSchemas.updateTournamentMatchSchema */ },
    async (req, reply) => {
      const { id, matchId } = req.params;
      const { winnerId, winnerAlias } = req.body;
      if (!winnerId && !winnerAlias) {
        return reply.code(400).send({ message: "Either winnerId or winnerAlias is required" });
      }
      if (winnerId && winnerAlias) {
        return reply.code(400).send({ message: "Only one of winnerId or winnerAlias should be provided" });
      }
      console.log("Updating match for tournament ID:", id, "Match ID:", matchId);
      try {
        const match = await prisma.tournamentMatch.findUnique({
          where: { id: Number(matchId) },
        });
        if (!match) {
          return reply.code(404).send({ message: "Match not found" });
        }
        if (match.tournamentId !== Number(id)) {
          return reply.code(400).send({ message: "Match does not belong to this tournament" });
        }
        const updatedMatch = await prisma.tournamentMatch.update({
          where: { id: Number(matchId) },
          data: {
            winnerId: winnerId || null,
            winnerAlias: winnerAlias || null,
            status: "completed",
          },
        });
        console.log("Match updated successfully:", updatedMatch);
        try {
        // generate matches for net round if applicable
        generateNextRoundMatches(id);
        //check if the tournament is finished
        isTournamentFinished(id, updatedMatch);
        
        } catch (error) {
          console.error("Error generating next round matches:", error);
        }
        reply.send(updatedMatch);
      } catch (error) {
        console.error("Error updating match:", error);
        reply.code(500).send({ message: "Server error" });
      }
    }
  );

}

//##############################################################

// Function to check if all matches in a tournament are completed
async function isTournamentFinished(id, updatedMatch) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: Number(id) },
    include: { tournamentMatches: true },
  });
  const pendingMatches = tournament.tournamentMatches.filter(match => match.status === "pending");
  if (pendingMatches.length === 0) {
    // If no pending matches, update tournament status to 'finished'
    await prisma.tournament.update({
      where: { id: Number(id) },
      data: { status: "finished", winnerId: updatedMatch.winnerId, 
        winnerAlias: updatedMatch.winnerAlias },
    });
    console.log("Tournament finished:", id);
    //increment the user's tournament wins
    if (updatedMatch.winnerId) {
      await prisma.user.update({
        where: { id: updatedMatch.winnerId },
        data: { tournamentWins: { increment: 1 } },
      });
      console.log("User's tournament wins incremented:", updatedMatch.winnerId);
    }
  }
}

//function for generating next round matches
async function generateNextRoundMatches(tournamentId) {
  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: Number(tournamentId), status: "completed" },
  });
  if (matches.length === 0 || matches.length % 2 !== 0) {
    // If there are no completed matches or an odd number of matches, we cannot proceed
    console.log("No completed matches or odd number of matches found:", tournamentId);
    return;
  }
  const winners = matches.map(match => {
    return match.winnerId ? { userId: match.winnerId, alias: match.winnerAlias } : { userId: null, alias: match.winnerAlias };
  });
  console.log("Winners from completed matches:", winners);
  
  const round = matches[0].round +1;
  const nextRoundMatches = [];
  for (let i = 0; i < winners.length; i += 2) {
    const p1 = winners[i];
    const p2 = winners[i + 1];
    nextRoundMatches.push({
      round: round,
      tournamentId: Number(tournamentId),
      player1Id: p1.userId,
      player1Alias: p1.alias,
      player2Id: p2.userId,
      player2Alias: p2.alias,
    });
  }
  
  console.log("Generated next round matches:", nextRoundMatches);
  
  // change the status of the used match reults to 'archived'
  await prisma.tournamentMatch.updateMany({
    where: { tournamentId: Number(tournamentId), status: "completed" },
    data: { status: "archived" },
  });

  // Create next round matches in the database
  await prisma.tournamentMatch.createMany({
    data: nextRoundMatches,
  });
}
