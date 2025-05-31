module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,json,ico,png,jpg,svg,woff2,woff,ttf,webmanifest}'
  ],
  swDest: '/sw.js',
  swSrc: 'public/sw-base.js',
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
};
