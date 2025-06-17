//Schemas for validating input data

const otpVerifyNoCoockieSchema = {
  body: {
    type: "object",
    properties: {
      code: { type: "string", minLength: 6, maxLength: 6 },
    },
    required: ["code"],
  },
  response: {
    200: { type: "object", properties: { message: { type: "string" } } },
    400: { type: "object", properties: { error: { type: "string" } } },
    403: { type: "object", properties: { error: { type: "string" } } },
    401: { type: "object", properties: { error: { type: "string" } } },
    500: { type: "object", properties: { error: { type: "string" } } },
  },
};

const otpVerifyWithCoockieSchema = {
  body: {
    type: "object",
    properties: {
      code: { type: "string", minLength: 6, maxLength: 6 },
    },
    required: ["code"],
  },
  response: {
    200: { type: "object", properties: { message: { type: "string" } } },
    400: { type: "object", properties: { error: { type: "string" } } },
    403: { type: "object", properties: { error: { type: "string" } } },
    401: { type: "object", properties: { error: { type: "string" } } },
    404: { type: "object", properties: { error: { type: "string" } } },
    500: { type: "object", properties: { error: { type: "string" } } },
  },
};

const otpWaitSchema = {
  response: {
    200: {
      type: "object",
      properties: { secondsLeft: { type: "integer", minimum: 0 } },
    },
    401: { type: "object", properties: { error: { type: "string" } } },
  },
};

const otpResendSchema = {
  response: {
    200: { type: "object", properties: { message: { type: "string" } } },
    401: { type: "object", properties: { error: { type: "string" } } },
    500: { type: "object", properties: { error: { type: "string" } } },
  },
};

const otpSendSchema = {
  response: {
    200: { type: "object", properties: { message: { type: "string" } } },
    400: { type: "object", properties: { error: { type: "string" } } },
    500: { type: "object", properties: { error: { type: "string" } } },
  },
};

export const otpSchemas = {
  otpVerifyNoCoockieSchema,
  otpVerifyWithCoockieSchema,
  otpWaitSchema,
  otpResendSchema,
  otpSendSchema,
};
