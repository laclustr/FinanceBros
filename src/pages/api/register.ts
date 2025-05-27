import { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
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

export const POST: APIRoute = async ({ request }) => {
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
