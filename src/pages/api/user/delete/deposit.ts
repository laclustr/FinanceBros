import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';

const prisma = new PrismaClient();

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get('token')?.value;
    const user = await verifyToken(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id: depositId } = await request.json();

    if (!depositId) {
      return new Response(JSON.stringify({ error: 'Deposit ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deposit = await prisma.Deposit.findUnique({
      where: {
        id: depositId,
        userId: user.id, // Ensure the deposit belongs to the authenticated user
      },
    });

    if (!deposit) {
      return new Response(JSON.stringify({ error: 'Deposit not found or unauthorized.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use a transaction to ensure atomicity
    await prisma.$transaction([
      prisma.Deposit.delete({
        where: { id: deposit.id },
      }),
      prisma.bankAccount.update({
        where: { id: deposit.bankAccountId },
        data: {
          balance: {
            decrement: deposit.amount, // Subtract the deposit amount from the balance
          },
        },
      }),
    ]);

    return new Response(JSON.stringify({ success: true, message: 'Deposit deleted successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error deleting deposit:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}