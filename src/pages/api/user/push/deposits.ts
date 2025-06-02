import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';

const prisma = new PrismaClient();

export async function POST({ request, cookies, redirect }) {
  try {
    const token = cookies.get('token')?.value;
    const user = await verifyToken(token);
    
    if (!user) {
      return redirect('/login/sign-in');
    }

    const form = await request.formData();
    const title = form.get('title') as string;
    const amountStr = form.get('amount') as string;
    
    if (!title || title.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Income source is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!amountStr) {
      return new Response(JSON.stringify({ error: 'Amount is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanAmount = amountStr.replace(/,/g, '');
    const amount = parseFloat(parseFloat(cleanAmount).toFixed(2));
    
    if (isNaN(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be a positive number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await prisma.Deposit.create({
      data: {
        userId: user.id,
        title: title.trim(),
        amount: amount
      },
    });

    return redirect('/dashboard');
    
  } catch (error) {
    console.error('Error creating deposit:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}