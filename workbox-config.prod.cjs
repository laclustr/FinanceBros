const path = require('path');

module.exports = {
  globDirectory: path.resolve(__dirname, 'dist/client'),
  globPatterns: ['**/*.*'],
  swDest: path.resolve(__dirname, 'dist/client/sw.js'),
  swSrc: path.resolve(__dirname, 'public/base.js'),
  maximumFileSizeToCacheInBytes: 100 * 1024 * 1024
};
