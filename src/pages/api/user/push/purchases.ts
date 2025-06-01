import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';

const prisma = new PrismaClient(); // Create a new instance here

export async function POST({ request, cookies, redirect }) {
  const token = cookies.get('token')?.value;
  const user = await verifyToken(token);
  if (!user) return redirect('/login/sign-in');

  const form = await request.formData();
  const title = form.get('title') as string;
  const amount = parseFloat(form.get('amount') as string);

  await prisma.Purchase.create({
    data: {
      userId: user.id,
      title,
      amount,
    },
  });

  return redirect('/dashboard');
}
