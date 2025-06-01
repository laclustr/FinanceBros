module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.*'
  ],
  swDest: '/sw.js',
  swSrc: 'public/sw-base.js',
  maximumFileSizeToCacheInBytes: 100 * 1024 * 1024
};