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
    
    const originalPurchase = await prisma.Purchase.findUnique({
        where: { id, userId: user.id },
    });

    if (!originalPurchase) {
        return new Response(JSON.stringify({ error: 'Purchase not found or unauthorized.' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const amountDifference = newAmount - originalPurchase.amount;

    // Check if the account has enough balance for the change
    const bankAccount = await prisma.bankAccount.findUnique({ where: { id: originalPurchase.bankAccountId }});
    if (bankAccount.balance < amountDifference) {
        return new Response(JSON.stringify({ error: 'Insufficient balance for this change.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    await prisma.$transaction([
        prisma.Purchase.update({
            where: { id },
            data: {
                title: title.trim(),
                amount: newAmount,
                date: new Date(date),
            },
        }),
        prisma.bankAccount.update({
            where: { id: originalPurchase.bankAccountId },
            data: {
                balance: {
                    decrement: amountDifference, // Decrement by the difference
                },
            },
        }),
    ]);

    return new Response(JSON.stringify({ success: true, message: 'Purchase updated successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error editing purchase:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}
