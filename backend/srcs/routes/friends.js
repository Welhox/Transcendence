import prisma from "../prisma.js";
import { authenticate } from "../middleware/authenticate.js";

export async function friendRoutes(fastify, options) {
  /* 	fastify.addHook('onRequest', async (request, reply) => {
		console.log('📥 Request received:', request.raw.url);
	  });	 */

  //####################################################################################################################################

  fastify.get(
    "/friend-status",
    { preHandler: authenticate },
    async (req, reply) => {
      const { userId1, userId2 } = req.query;

      if (!userId1 || !userId2) {
        return reply.code(400).send({ error: "Missing required user Id" });
      }

      const uid1 = Number(userId1);
      const uid2 = Number(userId2);

      try {
        // check if users are friends
        const user = await prisma.user.findUnique({
          where: { id: uid1 },
          include: {
            friends: {
              where: { id: uid2 },
            },
          },
        });

        const isFriend = user?.friends?.length > 0;

        // check if a friend request is pending (in either direction)
        const pendingRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: uid1, receiverId: uid2 },
              { senderId: uid2, receiverId: uid1 },
            ],
            status: "pending",
          },
        });

        return reply.send({
          isFriend,
          requestPending: !!pendingRequest,
        });
      } catch (error) {
        console.error(error);
        reply.code(500).send({ error: "Failed to fetch friend status" });
      }
    }
  );

  //####################################################################################################################################

  fastify.post(
    "/friend-request",
    { preHandler: authenticate },
    async (req, reply) => {
      const { receiverId } = req.body;
      const senderId = req.user.id;

      const receiverIdInt = Number(receiverId);
      const senderIdInt = Number(senderId);

      if (isNaN(receiverIdInt) || receiverIdInt === senderIdInt) {
        return reply.code(400).send({ error: "Invalid receiver ID" });
      }

      try {
        // check if users are already friends
        const sender = await prisma.user.findUnique({
          where: { id: senderIdInt },
          include: {
            friends: {
              where: { id: receiverIdInt },
            },
          },
        });

        if (sender?.friends?.length > 0) {
          return reply.code(409).send({ error: "You are already friends" });
        }

        // check if pending request already exists
        const existingRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: senderIdInt, receiverId: receiverIdInt },
              { senderId: receiverIdInt, receiverId: senderIdInt },
            ],
            status: "pending",
          },
        });

        if (existingRequest) {
          return reply
            .code(409)
            .send({ error: "Friend request already pending" });
        }

        // create new friend request
        await prisma.friendRequest.create({
          data: {
            senderId: senderIdInt,
            receiverId: receiverIdInt,
            status: "pending",
          },
        });

        return reply.code(201).send({ message: "Friend request sent" });
      } catch (error) {
        console.error("Error sending friend request", error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  //####################################################################################################################################

  fastify.post(
    "/friends/accept",
    { preHandler: authenticate },
    async (request, reply) => {
      const { requestId } = request.body;

      const requestRecord = await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "accepted" },
        include: {
          sender: true,
          receiver: true,
        },
      });

      // add friendship both ways
      await prisma.user.update({
        where: { id: requestRecord.receiverId },
        data: {
          friends: {
            connect: { id: requestRecord.senderId },
          },
        },
      });

      await prisma.user.update({
        where: { id: requestRecord.senderId },
        data: {
          friends: {
            connect: { id: requestRecord.receiverId },
          },
        },
      });

      return { success: true };
    }
  );

  fastify.post(
    "/friends/decline",
    { preHandler: authenticate },
    async (request, reply) => {
      const { requestId } = request.body;

      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "rejected" },
      });

      return { success: true };
    }
  );

  //####################################################################################################################################

  fastify.post(
    "/unfriend",
    { preHandler: authenticate },
    async (request, reply) => {
      const { userId1, userId2 } = request.body;

      if (!userId1 || !userId2 || userId1 === userId2) {
        return reply.status(400).send({ error: "Invalid user IDs" });
      }

      try {
        // remove userId2 from userId1's friends
        await prisma.user.update({
          where: { id: userId1 },
          data: {
            friends: {
              disconnect: { id: userId2 },
            },
          },
        });

        // remove userId1 from userId2's friends
        await prisma.user.update({
          where: { id: userId2 },
          data: {
            friends: {
              disconnect: { id: userId1 },
            },
          },
        });

        reply.send({ success: true });
      } catch (error) {
        console.error("Error while unfriending:", error);
        reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
}
