const path = require('path');

module.exports = {
  globDirectory: path.join(__dirname, 'dist'),
  globPatterns: [
    '**/*.*'
  ],
  globIgnores: [
    'sw.js'
  ],
  swDest: path.join(__dirname, 'dist/sw.js'),
  swSrc: path.join(__dirname, 'public/sw-base.js'),
  maximumFileSizeToCacheInBytes: 50 * 1024 * 1024
};
