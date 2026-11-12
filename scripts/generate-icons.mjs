import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const root = process.cwd();
const svgPath = path.join(root, 'public', 'logo-mark.svg');
const svg = await fs.readFile(svgPath);

const pngTargets = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
];

for (const target of pngTargets) {
  await sharp(svg)
    .resize(target.size, target.size)
    .png()
    .toFile(path.join(root, 'public', target.file));
  console.log(`wrote public/${target.file}`);
}

const png32 = await sharp(svg).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header[8] = 0;
header[9] = 0;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14);
header.writeUInt32LE(22, 18);

await fs.writeFile(
  path.join(root, 'public', 'favicon.ico'),
  Buffer.concat([header, png32])
);
console.log('wrote public/favicon.ico');
