module.exports = {
  globDirectory: 'src/',
  globPatterns: [
    '**/*.*'
  ],
  swDest: '/vercel/output/sw.js',
  swSrc: 'public/base.js',
  maximumFileSizeToCacheInBytes: 100 * 1024 * 1024
};