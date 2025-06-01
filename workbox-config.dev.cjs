module.exports = {
  globDirectory: 'src/',
  globPatterns: [
    '**/*.*'
  ],
  swDest: 'public/sw.js',
  swSrc: 'public/sw-base.js',
  maximumFileSizeToCacheInBytes: 100 * 1024 * 1024
};