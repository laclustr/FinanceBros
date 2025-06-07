const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

export async function GET({ url }) {
    const query = url.searchParams.get('query');

    if (!query || query.trim().length === 0) {
        return new Response(JSON.stringify({ results: [] }), {
          headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const res = await fetch(`https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(query)}&limit=5&active=true&apiKey=${POLYGON_API_KEY}`);

        if (!res.ok) {
            return new Response(JSON.stringify({ error: 'Polygon API failed' }), {
              status: 502
            });
        }

        const data = await res.json();

        const results = (data.results || []).map((r: any) => ({
            ticker: r.ticker,
            name: r.name
        }));

        return new Response(JSON.stringify({ results }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500
        });
    }
}