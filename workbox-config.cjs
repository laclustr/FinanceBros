module.exports = {
	globDirectory: 'public/',
	globPatterns: [
	  '**/*.{svg,jpg,js,css,html,json,astro}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
	  /^utm_/,
	  /^fbclid$/
	],
	skipWaiting: true,
	clientsClaim: true
  };
  