const fs = require('fs');
const zlib = require('zlib');
const files = [
  'dist/drift-slider.cjs.js',
  'dist/drift-slider.esm.js',
  'dist/drift-slider.jquery.js',
  'dist/drift-slider.umd.js',
];
files.forEach(f => {
  const raw = fs.readFileSync(f);
  const gz = zlib.gzipSync(raw, { level: 9 });
  console.log(f + ': raw=' + raw.length + ' gz=' + gz.length);
});
