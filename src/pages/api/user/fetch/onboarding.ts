import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';

const prisma = new PrismaClient();

export async function POST({ request }) {
  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
    }

    const verified = await verifyToken(token);
    if (!verified) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: verified.id },
      select: {
        id: true,
        onboarded: true,
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({
      onboarded: user.onboarded,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[onboarding] error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}