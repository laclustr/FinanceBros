import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';

const prisma = new PrismaClient();

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get('token')?.value;
    const verified = await verifyToken(token);

    if (!verified) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { age, income, employer, creditScore, accounts } = body;

    if (!age || typeof age !== 'number' || age < 13)
      return new Response(JSON.stringify({ error: 'Invalid age' }), { status: 400 });

    if (!income || typeof income !== 'string')
      return new Response(JSON.stringify({ error: 'Invalid income range' }), { status: 400 });

    if (creditScore === undefined || typeof creditScore !== 'number' || creditScore < 300 || creditScore > 850)
      return new Response(JSON.stringify({ error: 'Invalid credit score' }), { status: 400 });

    if (!Array.isArray(accounts) || accounts.length === 0)
      return new Response(JSON.stringify({ error: 'At least one bank account is required' }), { status: 400 });

    for (const acc of accounts) {
      if (!acc.name || typeof acc.name !== 'string')
        return new Response(JSON.stringify({ error: 'Each account must have a name' }), { status: 400 });

      if (!acc.type || !['checking', 'savings'].includes(acc.type))
        return new Response(JSON.stringify({ error: 'Each account must be either checking or savings' }), { status: 400 });

      if (typeof acc.balance !== 'number' || acc.balance <= 0)
        return new Response(JSON.stringify({ error: 'Each account must have a valid positive balance' }), { status: 400 });
    }

    await prisma.user.update({
      where: { id: verified.id },
      data: {
        onboarded: true
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Onboarding API error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}
