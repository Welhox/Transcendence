import nodemailer from "nodemailer";
import prisma from "./prisma.js";
import bcryptjs from "bcryptjs";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOTP(email, code) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Login Code",
    text: `Your OTP is: ${code}`,
  });
}

async function makeOTP(userId) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  // hash the code
  const hashedCode = await bcryptjs.hash(code, 10);
  //check if user already has a OTP
  try {
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
    } else {
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
  } catch (error) {
    // if there's an error, log it and throw an error
    console.error("Error creating OTP:", error);
    throw new Error("Failed to create OTP");
  }
}

export async function handleOtp(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is missing, or invalid");
  }
  console.log("handleOtp called with email:", email);
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new Error("User not found");
  }
  const userId = user.id;

  try {
    //check if there is already a Otp created under a minute ago, and do not make a new one in that case
    //to guard against OTP spamming
    try {
      const previousOtp = await prisma.otp.findFirst({
        where: { userId },
      });
      if (
        previousOtp &&
        Date.now() - new Date(previousOtp.updatedAt).getTime() < 60_000
      ) {
        console.log("wait before requesting a new OTP");
        return { success: false };
      }
    } catch {}
    console.log("STEP 1");
    const code = await makeOTP(userId);
    console.log("STEP 2");

    await sendOTP(email, code);
    console.log("STEP 3");

    return { success: true };
  } catch (err) {
    throw new Error("Failed to send OTP");
  }
}
