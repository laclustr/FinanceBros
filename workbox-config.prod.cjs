module.exports = {
  globDirectory: 'dist/client',
  globPatterns: [
    '**/*.*'
  ],
  swDest: 'dist/client/sw.js',
  swSrc: 'public/base.js',
  maximumFileSizeToCacheInBytes: 100 * 1024 * 1024
};