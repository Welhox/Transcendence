import nodemailer from "nodemailer";
import prisma from "../prisma.js";
import bcryptjs from "bcryptjs";
import { handleOtp } from "../handleOtp.js";
import { authenticate } from "../middleware/authenticate.js";
import { authenticateOptional } from "../middleware/authenticateOptional.js";
import { otpSchemas } from "../schemas/otpSchemas.js";
export async function otpRoutes(fastify, options) {
  //####################################################################################################################################

  // a rout for verifing the OTP witout making a cookie
  fastify.post(
    "/auth/otp/verify",
    { schema: otpSchemas.otpVerifyNoCoockieSchema, preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.id;
      try {
        if (typeof userId !== "number") {
          return reply.code(400).send({ error: "Invalid or missing user ID" });
        }

        const { code } = request.body;
        console.log("Verifying OTP for user ID:", userId, "with code:", code);

        await new Promise((resolve) => setTimeout(resolve, 1000));
        const otp = await prisma.otp.findFirst({
          where: {
            userId,
          },
        });
        if (!otp) {
          return reply.code(401).send({ error: "OTP not found" });
        }
        const isValid = await bcryptjs.compare(code, otp.code);
        if (!isValid) {
          return reply.code(401).send({ error: "Invalid OTP" });
        }
        //check that otp has not expired
        const now = new Date();
        if (now > otp.expiresAt) {
          return reply.code(403).send({ error: "OTP expired" });
        }
        // delete the OTP after successful verification
        await prisma.otp.delete({
          where: {
            id: otp.id,
          },
        });
        reply.code(200).send({ message: "OTP verified!" });
      } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: "Failed to verify OTP" });
      }
    }
  );

  //####################################################################################################################################

  // check if the OTP is valid and not expired
  fastify.post(
    "/auth/verify-otp",
    { schema: otpSchemas.otpVerifyWithCoockieSchema },
    async (request, reply) => {
      const temp = request.cookies.otpToken;
      if (!temp) {
        return reply.code(401).send({ error: "Missing token" });
      }
      let token;
      try {
        token = fastify.jwt.verify(temp);
      } catch {
        return reply.code(401).send({ error: "Invalid or expired token" });
      }

      if (!token?.id || !token?.email) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const { code } = request.body;
      const email = token.email;
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const userId = user.id;
      try {
        const otp = await prisma.otp.findFirst({
          where: {
            userId,
          },
        });
        if (!otp) {
          return reply.code(401).send({ error: "OTP not found" });
        }
        const isValid = await bcryptjs.compare(code, otp.code);
        if (!isValid) {
          return reply.code(401).send({ error: "Invalid OTP" });
        }
        //check that otp has not expired
        const now = new Date();
        if (now > otp.expiresAt) {
          return reply.code(403).send({ error: "OTP expired" });
        }
        // delete the OTP after successful verification
        await prisma.otp.delete({
          where: {
            id: otp.id,
          },
        });
        // set the acctual cookie and return it
        const token = fastify.jwt.sign(
          {
            id: user.id,
            username: user.username,
          },
          {
            expiresIn: "1h", // token expiration time
          }
        );

        // store JWT in cookie (httpOnly)
        // httpOnly means the cookie cannot be accessed via JavaScript, which helps mitigate XSS attacks
        // secure means the cookie will only be sent over HTTPS connections
        reply.setCookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict", // means the cookie won’t be sent if someone embeds your site in an iframe or from another domain
          path: "/",
          maxAge: 60 * 60, // 1 hour in seconds, same as JWT expiration
        });
        //remove the otp token
        reply.clearCookie("otpToken", { path: "/" });
        //and return
        reply.code(200).send({ message: "OTP verified!" });
      } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: "Failed to verify OTP" });
      }
    }
  );

  //####################################################################################################################################

  // check if there is a Otp and how long beofre a new one can be generated
  fastify.get(
    "/auth/otp-wait-time",
    { schema: otpSchemas.otpWaitSchema, preHandler: authenticateOptional },
    async (req, reply) => {
      const temp = req.cookies.otpToken;
      const userId = req.user?.id;

      if (!temp && !userId) {
        return reply.code(401).send({ error: "Missing token" });
      }
      let otp;
      if (userId) {
        otp = await prisma.otp.findFirst({
          where: { userId },
        });
      } else {
        let token;
        try {
          token = fastify.jwt.verify(temp);
        } catch {
          return reply.code(401).send({ error: "Invalid or expired token" });
        }

        otp = await prisma.otp.findFirst({
          where: { userId: token.id },
        });
      }
      if (!otp) {
        return reply.send({ secondsLeft: 0 });
      }

      const now = Date.now();
      const endOfCooldown = new Date(otp.updatedAt).getTime() + 60_000;
      const secondsLeft = Math.max(0, Math.ceil((endOfCooldown - now) / 1000));

      return reply.send({ secondsLeft });
    }
  );

  //####################################################################################################################################

  // a route for sending a new otp
  fastify.post(
    "/auth/resend-otp",
    { schema: otpSchemas.otpResendSchema },
    async (req, reply) => {
      const temp = req.cookies.otpToken;
      if (!temp) {
        return reply.code(401).send({ error: "Missing token" });
      }
      let token;
      try {
        token = fastify.jwt.verify(temp);
      } catch {
        return reply.code(401).send({ error: "Invalid or expired token" });
      }

      if (!token?.id || !token?.email) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      const email = token.email;
      try {
        handleOtp(email);
      } catch (error) {
        return reply.code(401).send(error);
      }
      return reply.code(200).send({ message: "new code sent" });
    }
  );

  //####################################################################################################################################

  // a route for sending a new otp
  fastify.post(
    "/auth/otp/send-otp",
    { schema: otpSchemas.otpSendSchema, preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.id;

      if (typeof userId !== "number") {
        return reply.code(400).send({ error: "Invalid or missing user ID" });
      }
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        console.log("send OTP to", user.email);
        if (typeof user.email !== "string") {
          return reply
            .code(400)
            .send({ error: "Invalid or missing user email" });
        }
        const result = await handleOtp(user.email);
        if (result.success) {
          reply.code(200).send({ message: "OTP sent" });
        } else {
          reply.code(400).send({ error: "unable to send OTP" });
        }
      } catch {
        reply.code(400).send({ error: "unable to send OTP catch" });
      }
    }
  );

  //####################################################################################################################################
}
