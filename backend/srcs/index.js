import Fastify from "fastify";
import cors from "@fastify/cors";
import { userRoutes } from "./routes/users.js";
import { sessionRoute } from "./routes/session.js";
import { statsRoute } from "./routes/stats.js";
import { otpRoutes } from "./routes/otp.js";
import { friendRoutes } from "./routes/friends.js";
import { profilePicRoute } from "./routes/profile_pic.js";
import { settingsRoutes } from "./routes/settings.js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import seedUsers from "./seed.js";
import fastifyJwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import dotenv from "dotenv";
import { matchesRoute } from "./routes/matches.js";
import { tournamentsRoute } from "./routes/tournaments.js";
import { startDBCleaner } from "./utils/DBCleaner.js";

const fastify = Fastify({ logger: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const assetsPath = resolve(__dirname, "../assets");
const fastifyStatic = (await import("@fastify/static")).default;

dotenv.config({ path: "./.env" });

const start = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("❌ JWT_SECRET is not defined in the environment.");
    }

    const isProduction = process.env.NODE_ENV === "production";

    await fastify.register(cors, {
      origin: isProduction
        ? ["https://transcendance.fi", "https://www.transcendance.fi"]
        : true, // allow any origin in dev, including REST client and postman etc.
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });

    fastify.register(cookie, {
      hook: "onRequest", // makes cookies available earlier in lifecycle
    });

    fastify.register(fastifyJwt, {
      secret: process.env.JWT_SECRET,
      cookie: {
        cookieName: "token",
        signed: false,
      },
    });

    fastify.register(fastifyStatic, {
      root: assetsPath,
      prefix: "/assets/", // this will serve at /assets/filename.jpg
    });

    fastify.register(fastifyMultipart, {
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
    });

    await fastify.register(rateLimit, {
      global:false,
    });

    //connect the routes to the backend
    fastify.register(userRoutes);
    fastify.register(sessionRoute);
    fastify.register(statsRoute);
    fastify.register(otpRoutes);
    fastify.register(friendRoutes);
    fastify.register(profilePicRoute);
    fastify.register(settingsRoutes);
    fastify.register(matchesRoute);
    fastify.register(tournamentsRoute);
    //add a seed of 5 users to the db
    try {
      await seedUsers();
    } catch (err) {
      console.warn("⚠️ Seeding skipped or failed gracefully:", err.message);
    }

    fastify.get("/ping", async () => {
      return { message: "pong" };
    });

    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server listening on http://localhost:3000");

    // Start the database cleaner
    startDBCleaner(60 * 60 * 1000); // runs every hour

  } catch (err) {
    console.log("Catch activated!!");
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
