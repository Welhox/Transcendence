// schemas/tournamentSchemas.js

// Shared schema for a tournament information
const participantSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    tournamentId: { type: "integer" },
    userId: { type: ["integer", "null"] },
    alias: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "tournamentId", "userId", "alias", "createdAt", "updatedAt"],
};

// Schema for creating a tournament
const createTournamentSchema = {
  description: "Create a new tournament",
  tags: ["tournaments"],
  body: {
    type: "object",
    properties: {
      name: { type: "string" },
      size: { type: "integer", enum: [4, 8, 16, 32] },
    },
    required: ["name", "size"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
        size: { type: "integer" },
        createdById: { type: "integer" },
        status: { type: "string", enum: ["waiting"] },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
      required: [
        "id",
        "name",
        "size",
        "createdById",
        "status",
        "createdAt",
        "updatedAt",
      ],
    },
    400: {
      type: "object",
      properties: { error: { type: "string", example: "Invalid size" } },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: { message: { type: "string", example: "Server error" } },
      required: ["message"],
    },
  },
};

// Schema for registering a participant
const registerTournamentSchema = {
  description: "Register a user for a tournament",
  tags: ["tournaments"],
  params: {
    type: "object",
    properties: {
      id: { type: "integer", minimum: 1 },
    },
    required: ["id"],
  },
  body: {
    type: "object",
    properties: {
      userId: { type: "integer" },
      alias: { type: "string" },
    },
    additionalProperties: false,
  },
  response: {
    200: participantSchema,
    400: {
      type: "object",
      properties: {
        message: { type: "string", example: "Invalid tournament ID" },
      },
      required: ["message"],
    },
    500: {
      type: "object",
      properties: { message: { type: "string", example: "Server error" } },
      required: ["message"],
    },
  },
};

// Schema for listing all tournaments
const getAllTournamentsSchema = {
  $id: "getTournamentsSchema",
  description: "Get all tournaments (with participants)",
  tags: ["tournaments"],
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          size: { type: "integer" },
          createdById: { type: "integer" },
          status: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          participants: { type: "array", items: participantSchema },
        },
        required: [
          "id",
          "name",
          "size",
          "createdById",
          "status",
          "createdAt",
          "updatedAt",
          "participants",
        ],
      },
    },
    500: {
      type: "object",
      properties: { message: { type: "string", example: "Server error" } },
      required: ["message"],
    },
  },
};

// Schema for fetching a single tournament by ID
const getTournamentSchema = {
  description: "Get a single tournament by ID (with participants & matches)",
  tags: ["tournaments"],
  params: {
    type: "object",
    properties: {
      id: { type: "integer", minimum: 1 },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
        size: { type: "integer" },
        createdById: { type: "integer" },
        status: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        participants: { type: "array", items: participantSchema },
        matches: {
          type: "array",
          items: { type: "object", additionalProperties: true },
        },
      },
      required: [
        "id",
        "name",
        "size",
        "createdById",
        "status",
        "createdAt",
        "updatedAt",
        "participants",
        "matches",
      ],
    },
    404: {
      type: "object",
      properties: {
        message: { type: "string", example: "Tournament not found" },
      },
      required: ["message"],
    },
    500: {
      type: "object",
      properties: { message: { type: "string", example: "Server error" } },
      required: ["message"],
    },
  },
};

export const tournamentsSchemas = {
  createTournamentSchema,
  registerTournamentSchema,
  getAllTournamentsSchema,
  getTournamentSchema,
};
