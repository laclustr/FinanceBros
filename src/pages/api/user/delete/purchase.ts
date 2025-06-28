import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts'; // Assuming this path is correct

const prisma = new PrismaClient();

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get('token')?.value;
    const user = await verifyToken(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required. Please log in.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id: purchaseId } = await request.json();

    if (!purchaseId) {
      return new Response(JSON.stringify({ error: 'Purchase ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find the purchase to ensure it belongs to the user and to get its details
    const purchase = await prisma.Purchase.findUnique({
      where: {
        id: purchaseId,
        userId: user.id, // Security check: Ensure the purchase belongs to the authenticated user
      },
    });

    if (!purchase) {
      return new Response(JSON.stringify({ error: 'Purchase not found or you do not have permission to delete it.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use a transaction to ensure both operations (delete and update) succeed or fail together
    await prisma.$transaction([
      // 1. Delete the purchase record
      prisma.Purchase.delete({
        where: { id: purchase.id },
      }),
      // 2. Add the purchase amount back to the bank account's balance
      prisma.bankAccount.update({
        where: { id: purchase.bankAccountId },
        data: {
          balance: {
            increment: purchase.amount,
          },
        },
      }),
    ]);

    return new Response(JSON.stringify({ success: true, message: 'Purchase deleted and funds returned successfully!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error deleting purchase:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}