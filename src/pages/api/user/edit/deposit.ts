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

    const { id, title, amount: newAmount, date } = await request.json();

    if (!id || !title || newAmount === undefined || !date) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const originalDeposit = await prisma.Deposit.findUnique({
        where: { id, userId: user.id },
    });

    if (!originalDeposit) {
        return new Response(JSON.stringify({ error: 'Deposit not found or unauthorized.' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const amountDifference = newAmount - originalDeposit.amount;

    await prisma.$transaction([
        prisma.Deposit.update({
            where: { id },
            data: {
                title: title.trim(),
                amount: newAmount,
                date: new Date(date),
            },
        }),
        prisma.bankAccount.update({
            where: { id: originalDeposit.bankAccountId },
            data: {
                balance: {
                    increment: amountDifference,
                },
            },
        }),
    ]);

    return new Response(JSON.stringify({ success: true, message: 'Deposit updated successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error editing deposit:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}