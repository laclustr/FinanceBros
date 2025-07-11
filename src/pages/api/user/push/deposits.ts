import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';

const prisma = new PrismaClient();

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get('token')?.value;
    const user = await verifyToken(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please log in.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const form = await request.formData();
    const title = form.get('title') as string;
    const accountName = form.get('account') as string;
    const amountStr = form.get('amount') as string;

    if (!title || !accountName || !amountStr) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanAmount = amountStr.replace(/,/g, '');
    const amount = Math.round(parseFloat(cleanAmount) * 100) / 100;

    if (isNaN(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be a valid positive number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        userId: user.id,
        name: accountName,
      },
    });

    if (!bankAccount) {
      return new Response(
        JSON.stringify({ error: 'Bank account not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await prisma.$transaction([
      prisma.deposit.create({
        data: {
          userId: user.id,
          bankAccountId: bankAccount.id,
          title: title.trim(),
          amount,
        },
      }),
      prisma.bankAccount.update({
        where: { id: bankAccount.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      }),
    ]);

    return new Response(
      JSON.stringify({ success: true, message: 'Deposit added successfully!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating deposit:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}