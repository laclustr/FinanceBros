import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';

const prisma = new PrismaClient();

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get('token')?.value;
    const user = await verifyToken(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id, title, target, deadline, progress } = await request.json();

    if (!id || !title || target === undefined || !deadline) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const goal = await prisma.Goal.findUnique({
      where: { id },
    });

    if (!goal || goal.userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Goal not found or unauthorized.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateData: any = {
      title: title.trim(),
      target: Number(target),
      deadline: new Date(deadline),
    };
    if (typeof progress === 'number') {
      updateData.progress = progress;
    }

    await prisma.Goal.update({
      where: { id },
      data: updateData,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Goal updated successfully.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error editing goal:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
