import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/pages/api/verify-token.ts';

const prisma = new PrismaClient();

export async function hasOnboarded(token: string | undefined): Promise<[user: any, onboarded: boolean]> {
  if (!token) return [null, false];

  const verified = await verifyToken(token);
  if (!verified) return [null, false];

  const user = await prisma.user.findUnique({
    where: { id: verified.id },
    select: {
      id: true,
      email: true,
      onboarded: true,
    },
  });

  if (!user) return [null, false];

  return [user, user.onboarded];
}