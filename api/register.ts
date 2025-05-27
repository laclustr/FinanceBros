import { APIRoute } from 'astro';
import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

function normalizeEmail(email: string): string {
  const [localPart, domain] = email.toLowerCase().split('@');
  if (!domain) return email.toLowerCase();

  const cleanedLocal = localPart.split('+')[0].replace(/\./g, '');
  return `${cleanedLocal}@${domain}`;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

export const POST: APIRoute = async (request) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Both email and password are required.',
          email: !!email,
          password: !!password,
        }),
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);

    if (!validateEmail(normalizedEmail)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email format.',
        }),
        { status: 400 }
      );
    }

    if (!validatePassword(password)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Password must be at least 8 characters long and include at least one lowercase letter, one uppercase letter, and one number.',
        }),
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'A user with that email already exists.',
          emailExists: true,
        }),
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email: normalizedEmail, password: hashedPassword },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registered successfully!',
        email: normalizedEmail,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[REGISTER ERROR]', error);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};