module.exports = {
  globDirectory: 'src/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,gif,svg,webp,avif,ico,woff,woff2,ttf,eot,json,xml,txt,pdf}'
  ],
  swDest: 'public/sw.js',
  swSrc: 'public/sw-base.js',
  maximumFileSizeToCacheInBytes: 100 * 1024 * 1024
};