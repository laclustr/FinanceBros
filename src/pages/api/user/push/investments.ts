import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token.ts';

const prisma = new PrismaClient();
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

export async function POST({ request, cookies, redirect }) {
  try {
    const token = cookies.get('token')?.value;
    const user = await verifyToken(token);

    if (!user) {
      return redirect('/login/sign-in');
    }

    const form = await request.formData();
    const assetName = form.get('assetName') as string;
    const amountStr = form.get('amount') as string;

    if (!assetName || assetName.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Asset name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!amountStr) {
      return new Response(JSON.stringify({ error: 'Investment amount is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanAmount = amountStr.replace(/,/g, '');
    const amount = parseFloat(parseFloat(cleanAmount).toFixed(2));

    if (isNaN(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Investment amount must be a positive number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const polygonResponse = await fetch(
      `https://api.polygon.io/v3/reference/tickers/${encodeURIComponent(assetName.trim().toUpperCase())}?apiKey=${POLYGON_API_KEY}`
    );

    if (!polygonResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to verify asset with Polygon' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const polygonData = await polygonResponse.json();

    if (
      !polygonData ||
      !polygonData.results ||
      !Array.isArray(polygonData.results) ||
      polygonData.results.length === 0 ||
      polygonData.results[0].active === false
    ) {
      return new Response(JSON.stringify({ error: 'Invalid or inactive asset' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    

    await prisma.Investment.create({
      data: {
        userId: user.id,
        assetName: assetName.trim().toUpperCase(),
        amount: amount,
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });    
  } catch (error) {
    console.error('Error creating investment:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}
