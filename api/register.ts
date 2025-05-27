import type { APIRoute } from 'astro';
import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const POST: APIRoute = async (request) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password required' }),
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User already exists' }),
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.User.create({
      data: { email, password: hashedPassword },
    });

    return new Response(
      JSON.stringify({ message: 'Registered successfully!' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[REGISTER ERROR]', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
