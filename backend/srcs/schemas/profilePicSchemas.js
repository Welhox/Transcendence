//Schema for profile picture upload

export const uploadProfilePicSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        profilePicUrl: { type: "string" },
      },
      required: ["success", "profilePicUrl"],
    },
    400: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    401: {
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
