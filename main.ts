import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entryPath = path.join(__dirname, 'entry.png');

if (!fs.existsSync(entryPath)) {
  console.error('entry.png not found');
  process.exit(1);
}

const buf = fs.readFileSync(entryPath);

if (buf.length > 1048576) {
  console.error(`File size ${buf.length} exceeds 1048576 bytes`);
  process.exit(1);
}

let format: 'PNG' | 'JPEG';
if (
  buf.length >= 8 &&
  buf[0] === 0x89 &&
  buf[1] === 0x50 &&
  buf[2] === 0x4E &&
  buf[3] === 0x47 &&
  buf[4] === 0x0D &&
  buf[5] === 0x0A &&
  buf[6] === 0x1A &&
  buf[7] === 0x0A
) {
  format = 'PNG';
} else if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xD8) {
  format = 'JPEG';
} else {
  console.error('Unknown image format');
  process.exit(1);
}

function parseDimensions(b: Buffer, fmt: 'PNG' | 'JPEG') {
  if (fmt === 'PNG') {
    const width = b.readUInt32BE(16);
    const height = b.readUInt32BE(20);
    return { width, height };
  } else {
    let offset = 2;
    while (offset < b.length) {
      while (offset < b.length && b[offset] === 0xFF) offset++;
      if (offset >= b.length) break;
      const marker = b[offset];
      offset++;
      if (marker === 0xD9 || marker === 0xDA) break;
      const length = b.readUInt16BE(offset);
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        const height = b.readUInt16BE(offset + 3);
        const width = b.readUInt16BE(offset + 5);
        return { width, height };
      }
      offset += length;
    }
    throw new Error('JPEG SOF marker not found');
  }
}

const { width, height } = parseDimensions(buf, format);
if (width > 1024 || height > 1024) {
  console.error(`Dimensions ${width}x${height} exceed 1024x1024`);
  process.exit(1);
}

if (format === 'PNG') {
  if (buf.length < 12 || buf.subarray(buf.length - 8, buf.length - 4).toString('ascii') !== 'IEND') {
    console.error('Invalid PNG: missing IEND chunk');
    process.exit(1);
  }
} else {
  if (buf.length < 2 || buf[buf.length - 2] !== 0xFF || buf[buf.length - 1] !== 0xD9) {
    console.error('Invalid JPEG: missing EOI marker');
    process.exit(1);
  }
}

const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'entry.png');
fs.writeFileSync(outputPath, buf);

const readBack = fs.readFileSync(outputPath);
if (readBack.length !== buf.length) {
  console.error('Output file byte length mismatch');
  process.exit(1);
}
if (format === 'JPEG' && (readBack[0] !== 0xFF || readBack[1] !== 0xD8)) {
  console.error('Magic bytes re-check failed on read-back output file');
  process.exit(1);
} else if (format === 'PNG' && (readBack[0] !== 0x89 || readBack[1] !== 0x50)) {
  console.error('Magic bytes re-check failed on read-back output file');
  process.exit(1);
}
if (Buffer.compare(readBack, buf) !== 0) {
  console.error('Byte comparison with output failed');
  process.exit(1);
}

const md5 = crypto.createHash('md5').update(buf).digest('hex');
console.log(`Format: ${format}, Dimensions: ${width}x${height}, Size: ${buf.length}, MD5: ${md5}`);
