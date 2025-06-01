import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';

const prisma = new PrismaClient();

export async function POST({ request, cookies, redirect }) {
  const token = cookies.get('token')?.value;
  const user = await verifyToken(token);
  if (!user) return redirect('/login/sign-in');

  const form = await request.formData();
  const title = form.get('title') as string;
  const targetAmount = parseFloat(form.get('targetAmount') as string);
  const deadline = form.get('deadline') as string; // expecting ISO string

  await prisma.Goal.create({
    data: {
      userId: user.id,
      title,
      targetAmount,
      deadline: new Date(deadline),
    },
  });

  return redirect('/dashboard');
}
