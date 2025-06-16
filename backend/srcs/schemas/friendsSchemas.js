//Schemas for validating input data

const getFriendStatusSchema = {
  querystring: {
    type: "object",
    required: ["userId1", "userId2"],
    properties: {
      userId1: { type: "integer", minimum: 1 },
      userId2: { type: "integer", minimum: 1 },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        isFriend: { type: "boolean" },
        requestPending: { type: "boolean" },
      },
      required: ["isFriend", "requestPending"],
    },
    400: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
  },
};

const sendFriendRequestSchema = {
  body: {
    type: "object",
    required: ["receiverId"],
    properties: {
      receiverId: { type: "integer", minimum: 1 },
    },
  },
  response: {
    201: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
    },
    400: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    409: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
  },
};

const acceptFriendRequestSchema = {
  body: {
    type: "object",
    required: ["requestId"],
    properties: {
      requestId: { type: "integer", minimum: 1 },
    },
  },
  response: {
    200: {
      type: "object",
      properties: { success: { type: "boolean" } },
      required: ["success"],
    },
    500: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
  },
};

const declineFriendRequestSchema = {
  body: {
    type: "object",
    required: ["requestId"],
    properties: {
      requestId: { type: "integer", minimum: 1 },
    },
  },
  response: {
    200: {
      type: "object",
      properties: { success: { type: "boolean" } },
      required: ["success"],
    },
    500: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
  },
};

const unfriendSchema = {
  body: {
    type: "object",
    required: ["userId1", "userId2"],
    properties: {
      userId1: { type: "integer", minimum: 1 },
      userId2: { type: "integer", minimum: 1 },
    },
  },
  response: {
    200: {
      type: "object",
      properties: { success: { type: "boolean" } },
      required: ["success"],
    },
    400: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
  },
};

export const friendsSchemas = {
  getFriendStatusSchema,
  sendFriendRequestSchema,
  acceptFriendRequestSchema,
  declineFriendRequestSchema,
  unfriendSchema,
};
