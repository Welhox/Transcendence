// This schema defines the structure for fetching a user's game statistics.
//description and tags are used for documentation purposes in Fastify (swagger), not in use at the moment.
export const statsSchema = {
  description: "Fetch a user’s game statsistics",
  tags: ["stats"],
  params: {
    type: "object",
    properties: {
      userId: { type: "integer", minimum: 1 },
    },
    required: ["userId"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        totalWins: { type: "integer", minimum: 0 },
        totalLosses: { type: "integer", minimum: 0 },
        totalTournamentsWon: { type: "integer", minimum: 0 },
        matchHistory: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string", format: "date-time" },
              result: { type: "string", enum: ["Win", "Loss"] },
              opponent: { type: "string" },
            },
            required: ["date", "result", "opponent"],
          },
        },
      },
      required: [
        "totalWins",
        "totalLosses",
        "totalTournamentsWon",
        "matchHistory",
      ],
    },
    400: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
    },
    404: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
    },
    500: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
    },
  },
};
