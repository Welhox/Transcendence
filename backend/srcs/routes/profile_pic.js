import fs from "fs";
import path from "path";
import prisma from "../prisma.js";
import sharp from "sharp";
import { authenticate } from "../middleware/authenticate.js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { fileTypeFromBuffer } from "file-type";
import { uploadProfilePicSchema } from "../schemas/profilePicSchemas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = resolve(__dirname, "../../assets"); // absolute path

export async function profilePicRoute(fastify, opts) {
  // ensure the uploads dir exists
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  fastify.post(
    "/user/profile-pic",
    { schema: uploadProfilePicSchema, preHandler: authenticate },
    async (req, reply) => {
      const userId = req.user?.id;
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });

      try {
        const parts = req.parts();
        for await (const part of parts) {
          if (part.type !== "file") continue;

          const allowedTypes = ["image/jpeg", "image/png"];
          if (!allowedTypes.includes(part.mimetype)) {
            return reply.status(400).send({ error: "Invalid file type" });
          }

          const fileBuffer = await part.toBuffer();

          if (!fileBuffer || fileBuffer.length === 0) {
            return reply.status(400).send({ error: "Empty file buffer" });
          }

          const fileTypeResult = await fileTypeFromBuffer(fileBuffer);

          if (!fileTypeResult || !allowedTypes.includes(fileTypeResult.mime)) {
            return reply.status(400).send({ error: "Invalid file content" });
          }

          const processedImage = await sharp(fileBuffer)
            .resize(256, 256, { fit: "cover" }) // uniform size
            .toBuffer();

          const fileExt = fileTypeResult.ext;
          const safeName = `${userId}_${Date.now()}.${fileExt}`;
          const tempPath = path.join(UPLOAD_DIR, safeName);
          const publicPath = `/assets/${safeName}`; // for frontend use

          //const writeStream = fs.createWriteStream(tempPath);

          fs.writeFileSync(tempPath, processedImage);

          // delete old profile pic if one exists
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user?.profilePic) {
            const oldPicName = path.basename(user.profilePic);
            const oldPicPath = path.join(UPLOAD_DIR, oldPicName);
            if (fs.existsSync(oldPicPath)) {
              fs.unlinkSync(oldPicPath);
            }
          }

          // update DB with new profile pic path
          await prisma.user.update({
            where: { id: userId },
            data: { profilePic: publicPath },
          });
          return reply.send({ success: true, profilePicUrl: publicPath });
        }
        return reply.status(400).send({ error: "No file uploaded" });
      } catch (error) {
        console.error("Profile pic upload failed:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
}
