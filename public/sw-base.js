importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  const { registerRoute } = workbox.routing;
  const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;

  const networkFirstHandler = new NetworkFirst({
    cacheName: 'pages-cache',
  });

  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
  );

  registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style',
    new StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
      cacheName: 'fonts-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 60 * 24 * 60 * 60,
        }),
      ],
    })
  );

  registerRoute(
    ({ request }) => request.destination === 'video' || request.destination === 'audio',
    new CacheFirst({
      cacheName: 'media-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    })
  );

  registerRoute(
    ({ request }) => request.destination === 'worker' || request.destination === 'manifest',
    new NetworkFirst({
      cacheName: 'worker-manifest-cache',
    })
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
        return new Response(
          JSON.stringify({ error: 'No Internet' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
  );
  registerRoute(
    ({ request }) => request.mode === 'navigate',
    async (args) => {
      try {
        const response = await networkFirstHandler.handle(args);
        if (response) return response;
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      } catch (e) {
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }
  );
}
