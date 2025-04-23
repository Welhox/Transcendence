import nodemailer from 'nodemailer';
import prisma from '../prisma.js'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOTP(email, code) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Login Code',
    text: `Your OTP is: ${code}`,
  });
}

// const makeOTP = () => {
// 	const code 
	
// }

fastify.post('/auth/send-otp', async (req, reply) => {
	const { email } = req.body;

	const code = Math.floor(100000 + Math.random() * 900000).toString();
	const expiresAt = Date.now() + 5 * 60 * 1000;
  
	otpStore.set(email, { code, expiresAt });
  
	try {
	  await sendOTP(email, code);
	  reply.send({ message: 'OTP sent!' });
	} catch (err) {
	  fastify.log.error(err);
	  reply.code(500).send({ error: 'Failed to send email' });
	}
  });

export default sendOTP
