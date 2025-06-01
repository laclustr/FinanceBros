module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.*'
  ],
  swDest: 'dist/sw.js',
  swSrc: 'public/sw-base.js',
  maximumFileSizeToCacheInBytes: 100 * 1024 * 1024
};