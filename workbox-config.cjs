module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
	  '**/*.{svg,jpg,js,css,html,json,astro}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
	  /^utm_/,
	  /^fbclid$/
	],
	skipWaiting: true,
	clientsClaim: true
  };
  