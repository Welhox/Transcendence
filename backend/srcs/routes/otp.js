import nodemailer from 'nodemailer';
import prisma from '../prisma.js'
import bcryptjs from 'bcryptjs';

export async function otpRoutes(fastify, options) {

  // check if the OTP is valid and not expired
fastify.post('/auth/verify-otp', async (req, reply) => {
  
  const temp = req.cookies.otpToken
  if (!temp) {
    return reply.code(401).send({ error: 'Missing token'})
  }
  let token
  try {
    token = fastify.jwt.verify(temp);
  }
  catch {
    return reply.code(401).send({ error: 'Invalid or expired token'})
  }

  if (!token?.id || !token?.email){
    return reply.code(401).send({ error: 'Unauthorized'})
  }
  
  const { code } = req.body;
  console.log(code)
  const email = token.email
  const user = await prisma.user.findUnique({
    where: {email},
  });
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }
  await new Promise(resolve => setTimeout(resolve, 1000))
  const userId = user.id;
  try {
    const otp = await prisma.otp.findFirst({
      where: {
        userId,
      },
    });
    if (!otp) {
      return reply.code(401).send({ error: 'OTP not found' });
    }
    const isValid = await bcryptjs.compare(code, otp.code);
    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid OTP' });
    }
    //check that otp has not expired
    const now = new Date();
    if (now > otp.expiresAt) {
      return reply.code(403).send({ error: 'OTP expired' });
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
        expiresIn: '1h', // token expiration time
      }
    );

    // store JWT in cookie (httpOnly)
    // httpOnly means the cookie cannot be accessed via JavaScript, which helps mitigate XSS attacks
    // secure means the cookie will only be sent over HTTPS connections
    reply.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', // means the cookie won’t be sent if someone embeds your site in an iframe or from another domain 
        path: '/',
        maxAge: 60 * 60, // 1 hour in seconds, same as JWT expiration
    })
    //remove the otp token
    reply.clearCookie('otpToken', { path: '/'})
    //and return
    reply.code(200).send({ message: 'OTP verified!' });
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Failed to verify OTP' });
  } 
  });
}


