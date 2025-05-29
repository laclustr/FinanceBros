module.exports = {
	globDirectory: 'public/',
	globPatterns: [
	  '**/*.{html,js,css,svg,jpg,png,json,woff2,webmanifest}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
	  /^utm_/,
	  /^fbclid$/
	],
	clientsClaim: true,
	skipWaiting: true,
	runtimeCaching: [
	  {
		urlPattern: ({ request }) => request.mode === 'navigate',
		handler: 'NetworkFirst',
		options: {
		  cacheName: 'pages-cache',
		  networkTimeoutSeconds: 3,
		  expiration: { maxEntries: 50 },
		  plugins: [
			{
			  handlerDidError: async () => {
				return caches.match('/offline.html');
			  }
			}
		  ]
		},
	  },
	  {
		urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style',
		handler: 'StaleWhileRevalidate',
		options: { cacheName: 'assets-cache' },
	  },
	  {
		urlPattern: ({ request }) => request.destination === 'image',
		handler: 'CacheFirst',
		options: {
		  cacheName: 'images-cache',
		  expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
		},
	  },
	],
  };