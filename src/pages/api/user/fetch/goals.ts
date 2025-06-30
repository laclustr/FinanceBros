import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/pages/api/verify-token.ts';

const prisma = new PrismaClient();

export async function POST({ request, cookies, redirect }) {
    try {
        const token = cookies.get('token')?.value;
        const user = await verifyToken(token);
    
        if (!user) {
          return redirect('/login/sign-in');
        }
    
        const goals = await prisma.Goal.findMany({
          where: {
            userId: user.id,
          },
          orderBy: {
            id: 'asc',
          },
        });
    
        return new Response(JSON.stringify(goals), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
    
      } catch (error) {
        console.error('Error fetching goals:', error.message, error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      } finally {
        await prisma.$disconnect();
      }
}