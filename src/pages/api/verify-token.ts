import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { APIRoute } from 'astro';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

export async function verifyToken(token) {
  if (!token) return null;

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return null;
    return { id: user.id, email: user.email };
  } catch (err) {
    console.error('Database error:', err);
    return null;
  }
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader
        .split(';')
        .map(cookie => cookie.trim().split('='))
    );

    const token = cookies['token'];
    const user = await verifyToken(token);

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
