importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

self.__WB_MANIFEST;

workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
  })
);

workbox.routing.registerRoute(
  ({request}) => true,
  new workbox.strategies.NetworkFirst({
    cacheName: 'network-first-cache',
  })
);
