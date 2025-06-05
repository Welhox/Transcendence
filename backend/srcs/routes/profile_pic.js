import fs from 'fs'
import path from 'path'
import prisma from '../prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { pipeline } from 'stream/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const UPLOAD_DIR = resolve(__dirname, '../../assets') // absolute path

export async function profilePicRoute(fastify, opts) {

	// ensure the uploads dir exists
	if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

	fastify.post('/user/profile-pic', { preHandler: authenticate } , async (req, reply) => {
		const userId = req.user?.id;
		if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

		const parts = req.parts();
		for await (const part of parts) {
			if (part.type !== 'file') return;

			const { filename, mimetype } = part;
			const allowedTypes = ['image/jpeg', 'image/png'];
			if (!allowedTypes.includes(mimetype)) {
				return reply.status(400).send({ error: 'Invalid file type' });
			}

			const fileExt = path.extname(filename);
			const safeName = `${userId}_${Date.now()}${fileExt}`;
			const tempPath = path.join(UPLOAD_DIR, safeName);
			const publicPath = `/assets/${safeName}`; // for frontend use

			const writeStream = fs.createWriteStream(tempPath);

			try {
				await pipeline(part.file, writeStream);
			} catch (error) {
				return reply.status(400).send({ error: 'Upload failed or file too large' });
			}

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
		return reply.status(400).send({ error: 'No file uploaded' });
	});
}