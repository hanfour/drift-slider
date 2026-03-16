const fs = require('fs');
const zlib = require('zlib');

const files = [
  "/Volumes/SATECHI DISK Media/UserFolders/Projects/library/jquery/drift-slider/dist/drift-slider.cjs.js",
  "/Volumes/SATECHI DISK Media/UserFolders/Projects/library/jquery/drift-slider/dist/drift-slider.esm.js",
  "/Volumes/SATECHI DISK Media/UserFolders/Projects/library/jquery/drift-slider/dist/drift-slider.jquery.js",
  "/Volumes/SATECHI DISK Media/UserFolders/Projects/library/jquery/drift-slider/dist/drift-slider.umd.js"
];

files.forEach(fpath => {
  const fname = fpath.split('/').pop();
  const raw = fs.readFileSync(fpath);
  const gz = zlib.gzipSync(raw);
  console.log(`${fname}: raw=${raw.length} gz=${gz.length}`);
});
