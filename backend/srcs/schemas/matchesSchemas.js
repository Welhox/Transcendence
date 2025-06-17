//Schemas for validating input data

export const matchResultSchema = {
  body: {
    type: "object",
    required: [
      "player",
      "opponent",
      "winner",
      "loser",
      "leftScore",
      "rightScore",
    ],
    properties: {
      player: { type: "string", minLength: 1 },
      opponent: { type: "string", minLength: 1 },
      winner: { type: "string", minLength: 1 },
      loser: { type: "string", minLength: 1 },
      leftScore: { type: "integer", minimum: 0 },
      rightScore: { type: "integer", minimum: 0 },
    },
  },
  response: {
    200: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
    },
    201: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
    },
    500: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
  },
};
