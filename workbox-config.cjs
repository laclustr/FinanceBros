module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
	  '**/*.{html,js,css,svg,jpg,png,json,woff2}'
	],
	swDest: 'dist/sw.js',
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
		},
	  },
	  {
		urlPattern: ({ request }) => request.destination === 'style' || request.destination === 'script',
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
  