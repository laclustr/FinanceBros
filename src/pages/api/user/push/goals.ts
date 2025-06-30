import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/pages/api/verify-token.ts';

const prisma = new PrismaClient();

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get('token')?.value;
    const user = await verifyToken(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const form = await request.formData();
    const title = form.get('title') as string;
    const targetStr = form.get('target') as string;
    const deadline = form.get('deadline') as string;

    if (!title || title.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Goal title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!targetStr) {
      return new Response(JSON.stringify({ error: 'Target amount is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!deadline) {
      return new Response(JSON.stringify({ error: 'Deadline is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanTarget = targetStr.replace(/,/g, '');
    const target = parseFloat(parseFloat(cleanTarget).toFixed(2));

    if (isNaN(target) || target <= 0) {
      return new Response(JSON.stringify({ error: 'Target amount must be a positive number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deadlineDate <= today) {
      return new Response(JSON.stringify({ error: 'Deadline must be in the future' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const goals = await prisma.Goal.findMany({
        where: {
          userId: user.id,
        },
    });
    
    if (goals.length >= 4) {
      return new Response(JSON.stringify({ error: 'Maximum of 4 goals reached.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await prisma.Goal.create({
      data: {
        userId: user.id,
        title: title.trim(),
        target: target,
        deadline: deadlineDate,
        progress: 0
      },
    });

    return new Response(JSON.stringify({ message: 'Goal created successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating goal:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}
