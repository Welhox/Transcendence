import prisma from "./prisma.js";

/*
Recalculates total wins and total losses for each user based on the match history.
DOESN'T UPDATE TOURNAMENT WONS YET
*/
async function recalculateUserStats() {
  try {
    const users = await prisma.user.findMany();

    for (const user of users) {
      // matches where user is the player
      const asPlayer = await prisma.match.findMany({
        where: { playerId: user.id },
        select: { result: true },
      });

      // matches where user is opponent
      const asOpponent = await prisma.match.findMany({
        where: { opponentId: user.id },
        select: { result: true },
      });

      // wins: user was player and won, or opponent and other player lost
      const wins =
        asPlayer.filter((m) => m.result === "win").length +
        asOpponent.filter((m) => m.result === "loss").length;

      // losses: user was player and lost, or opponent and other player won
      const losses =
        asPlayer.filter((m) => m.result === "loss").length +
        asOpponent.filter((m) => m.result === "win").length;

      await prisma.user.update({
        where: { id: user.id },
        data: { wins, losses },
      });
    }

    console.log("✅ User stats recalculated.");
  } catch (error) {
    console.error("Error recalculating stats:", error);
  } finally {
    await prisma.$disconnect();
  }
}

export default recalculateUserStats;
