import nodemailer from 'nodemailer';
import prisma from '../prisma.js'
import bcryptjs from 'bcryptjs';

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

async function makeOTP(userId) {
	const code = Math.floor(100000 + Math.random() * 900000).toString();
	const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  // hash the code
  const hashedCode = await bcryptjs.hash(code, 10);
  //check if user already has a OTP
  try
  {
  const existingOtp = await prisma.otp.findFirst({
    where: {
      userId,
    },
  });
  if (existingOtp) {
    // if the user already has an OTP, update it
    await prisma.otp.update({
      where: {
        id: existingOtp.id,
      },
      data: {
        code: hashedCode,
        expiresAt,
      },
    });
  }
  else {
    // if the user doesn't have an OTP, create a new one
    await prisma.otp.create({
      data: {
        userId,
        code: hashedCode,
        expiresAt,
      },
    });
  }
  return code;
  }
  // if there's an error, log it and throw an error
  catch (error) {
    console.error('Error creating OTP:', error);
    throw new Error('Failed to create OTP');
  }
}

export async function otpRoutes(fastify, options) {

fastify.post('/auth/send-otp', async (req, reply) => {
	const { email } = req.body;
  console.log('got here and all good')
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }
  const userId = user.id;
	try {
    const code = await makeOTP(userId);
	  await sendOTP(email, code);
	  reply.send({ message: 'OTP sent!' });
	} catch (err) {
	  fastify.log.error(err);
	  reply.code(500).send({ error: 'Failed to send OTP' });
	}
  });


  // check if the OTP is valid and not expired
fastify.post('/auth/verify-otp', async (req, reply) => {
  const { email, code } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }
  const userId = user.id;
  try {
    const otp = await prisma.otp.findFirst({
      where: {
        userId,
      },
    });
    if (!otp) {
      return reply.code(404).send({ error: 'OTP not found' });
    }
    const isValid = await bcryptjs.compare(code, otp.code);
    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid OTP' });
    }
    //check that otp has not expired
    const now = new Date();
    if (now > otp.expiresAt) {
      return reply.code(401).send({ error: 'OTP expired' });
    }
    // delete the OTP after successful verification
    await prisma.otp.delete({
      where: {
        id: otp.id,
      },
    });
    // set user to active if inactive
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
    reply.code(200).send({ message: 'OTP verified!' });
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Failed to verify OTP' });
  } 
  });
}
