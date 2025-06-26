import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';

const prisma = new PrismaClient();

export async function POST({ request, cookies, redirect }) {
  try {
    const token = cookies.get('token')?.value;
    const user = await verifyToken(token);

    // Check if this is an AJAX request
    const acceptHeader = request.headers.get('accept');
    const isAjaxRequest = acceptHeader?.includes('application/json');

    if (!user) {
      if (isAjaxRequest) {
        return new Response(JSON.stringify({ error: 'Authentication required. Please log in.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return redirect('/login/sign-in');
      }
    }

    const form = await request.formData();
    const title = form.get('title') as string;
    const accountName = form.get('account') as string;
    const amountStr = form.get('amount') as string;

    if (!title || !accountName || !amountStr) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanAmount = amountStr.replace(/,/g, '');
    const amount = Math.round(parseFloat(cleanAmount) * 100) / 100;

    if (isNaN(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be a valid positive number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        userId: user.id,
        name: accountName,
      },
    });

    if (!bankAccount) {
      return new Response(JSON.stringify({ error: 'Bank account not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (bankAccount.balance < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await prisma.$transaction([
      prisma.purchase.create({
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
            decrement: amount,
          },
        },
      }),
    ]);

    if (isAjaxRequest) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Purchase added successfully!' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return redirect('/dashboard');
    }

  } catch (error) {
    console.error('Error creating purchase:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}