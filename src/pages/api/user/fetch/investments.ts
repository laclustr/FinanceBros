import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../verify-token';

const prisma = new PrismaClient();
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get('token')?.value;
    const user = await verifyToken(token);

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/login/sign-in' },
      });
    }

    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return new Response(JSON.stringify({ error: 'Missing startDate or endDate' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const investments = await prisma.Investment.findMany({
      where: {
        userId: user.id,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { id: 'desc' },
    });

    const enriched = await Promise.all(investments.map(async (inv) => {
      const from = inv.date.toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];

      const polygonUrl = `https://api.polygon.io/v2/aggs/ticker/${inv.assetName}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=1000&apiKey=${POLYGON_API_KEY}`;
      try {
        const res = await fetch(polygonUrl);
        if (!res.ok) throw new Error(`Polygon error for ${inv.assetName}`);
        const data = await res.json();

        const prices = (data.results || []).map(d => ({
          timestamp: d.t,
          close: d.c,
        }));

        return {
          ...inv,
          priceHistory: prices,
        };
      } catch (e) {
        console.error(`Error fetching chart for ${inv.assetName}:`, e);
        return {
          ...inv,
          priceHistory: [],
        };
      }
    }));

    return new Response(JSON.stringify(enriched), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching investments with chart data:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}