import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';

const prisma = new PrismaClient();

function validateAccounts(accounts: Array<{ name: string; type: string; balance: number }>) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error('At least one bank account is required');
  }

  for (const acc of accounts) {
    if (!acc.name || typeof acc.name !== 'string') {
      throw new Error('Each account must have a name');
    }

    if (!acc.type || !['checking', 'savings'].includes(acc.type)) {
      throw new Error('Each account must be either checking or savings');
    }

    if (typeof acc.balance !== 'number' || acc.balance <= 0) {
      throw new Error('Each account must have a valid positive balance');
    }
  }
}

async function saveAccounts(userId: number, accounts: Array<{ name: string; type: string; balance: number }>) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      bankAccounts: {
        create: accounts.map(acc => ({
          name: acc.name,
          type: acc.type,
          balance: acc.balance,
        })),
      },
    },
  });
}

export async function createAccounts(userId: number, accounts: Array<{ name: string; type: string; balance: number }>) {
  validateAccounts(accounts);
  await saveAccounts(userId, accounts);
}

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get('token')?.value;
    const verified = await verifyToken(token);

    if (!verified) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { accounts } = await request.json();

    try {
      validateAccounts(accounts);
    } catch (validationError) {
      return new Response(JSON.stringify({ error: validationError.message }), { status: 400 });
    }

    await saveAccounts(verified.id, accounts);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Bank Account Registration Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}