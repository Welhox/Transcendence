const changeEmailSchema = {
  body: {
    type: "object",
    properties: {
      newValue: { type: "string", format: "email" },
      currentPassword: { type: "string", minLength: 2 }, // change to 6 for production
    },
    required: ["newValue", "currentPassword"],
  },
  response: {
    200: { type: "object", properties: { message: { type: "string" } } },
    400: { type: "object", properties: { message: { type: "string" } } },
    401: { type: "object", properties: { message: { type: "string" } } },
    403: { type: "object", properties: { message: { type: "string" } } },
    404: { type: "object", properties: { message: { type: "string" } } },
    500: { type: "object", properties: { error: { type: "string" } } },
  },
};

const changePasswordSchema = {
  body: {
    type: "object",
    properties: {
      newValue: { type: "string", minLength: 6, maxLength: 30 },
      currentPassword: { type: "string", minLength: 2 }, // change to 6 for production
    },
    required: ["newValue", "currentPassword"],
  },
  response: {
    200: { type: "object", properties: { message: { type: "string" } } },
    401: { type: "object", properties: { message: { type: "string" } } },
    403: { type: "object", properties: { message: { type: "string" } } },
    404: { type: "object", properties: { message: { type: "string" } } },
    500: { type: "object", properties: { error: { type: "string" } } },
  },
};

const changeLanguageSchema = {
  body: {
    type: "object",
    properties: {
      language: { type: "string", enum: ["en", "fi", "se"] },
    },
    required: ["language"],
  },
  response: {
    200: { type: "object", properties: { language: { type: "string" } } },
    401: { type: "object", properties: { error: { type: "string" } } },
    500: { type: "object", properties: { error: { type: "string" } } },
  },
};

export const settingsSchemas = {
  changeEmailSchema,
  changePasswordSchema,
  changeLanguageSchema,
};
