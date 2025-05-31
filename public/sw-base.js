importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  const { registerRoute } = workbox.routing;
  const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;

  const networkFirstHandler = new NetworkFirst();

  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst()
  );
  registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style',
    new StaleWhileRevalidate()
  );
  registerRoute(
    ({ request }) => request.destination === 'document',
    async (args) => {
      try {
        return await networkFirstHandler.handle(args);
      } catch (e) {
        return Response.error();
      }
    }
  );
  registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst()
  );
  registerRoute(
    ({ request }) => request.destination === 'video',
    new CacheFirst()
  );
  registerRoute(
    ({ request }) => request.destination === 'audio',
    new CacheFirst()
  );
  registerRoute(
    ({ request }) => request.destination === 'worker',
    new NetworkFirst()
  );
  registerRoute(
    ({ request }) => request.destination === 'manifest',
    new NetworkFirst()
  );

  registerRoute(
    ({ url }) => url.pathname.startsWith('/api'),
    async ({ request }) => {
      try {
        const response = await fetch(request);
        if (!response.ok) {
          return response;
        }
        return response;
      } catch (e) {
        return new Response(JSON.stringify({ error: 'No Internet' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  );
  

  registerRoute(
    ({ request }) => true,
    async (args) => {
      try {
        return await networkFirstHandler.handle(args);
      } catch (e) {
        return Response.error();
      }
    }
  );

  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
}
