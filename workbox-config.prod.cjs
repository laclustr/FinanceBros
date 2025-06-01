module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.*'
  ],
  swDest: 'public/sw.js',
  swSrc: 'public/base.js',
  maximumFileSizeToCacheInBytes: 100 * 1024 * 1024
};