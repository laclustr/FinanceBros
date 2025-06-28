import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';
import { createAccounts } from './accounts.ts'

const prisma = new PrismaClient();

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get('token')?.value;
    const verified = await verifyToken(token);

    if (!verified) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    let { age, income, employer, creditScore, accounts, firstName, lastName } = body;

    if (!employer) {
      employer = 'none';
    }

    if (!age || typeof age !== 'number' || age < 13)
      return new Response(JSON.stringify({ error: 'Invalid age' }), { status: 400 });

    if (!income || typeof income !== 'string' || !['under-1000', '1000-3000', '3000-5000', 'over-5000'].includes(income))
      return new Response(JSON.stringify({ error: 'Invalid income range' }), { status: 400 });

    if (creditScore === undefined || typeof creditScore !== 'number' || creditScore < 300 || creditScore > 850)
      return new Response(JSON.stringify({ error: 'Invalid credit score' }), { status: 400 });

    if (!Array.isArray(accounts) || accounts.length === 0)
      return new Response(JSON.stringify({ error: 'At least one bank account is required' }), { status: 400 });

    await prisma.user.update({
      where: { id: verified.id },
      data: {
        onboarded: true,
        firstName: firstName,
        lastName: lastName,
        age,
        income,
        employer,
        creditScore,
      },
    });

    await createAccounts(verified.id, accounts);

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