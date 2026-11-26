import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(scriptDir, '..', 'frontend', 'public');

const COLORS = {
  forest900: [0x16, 0x3f, 0x33, 0xff],
  cream: [0xfa, 0xf6, 0xee, 0xff],
  clay600: [0xb8, 0x43, 0x1e, 0xff],
  turmeric: [0xe3, 0xb2, 0x3c, 0xff],
};

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, crcInput, crcBuf]);
}

function renderIconPng(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * (size * 4 + 1);
    raw[rowOffset] = 0; // PNG filter type 0 (None)
    const ny = y / size;

    for (let x = 0; x < size; x += 1) {
      const nx = x / size;
      let color = COLORS.forest900;

      // Top and bottom tribal geometric border bands
      if (ny < 0.08 || ny > 0.92) {
        const slot = Math.floor(nx * 12) % 4;
        if (slot === 0) color = COLORS.clay600;
        else if (slot === 1) color = COLORS.turmeric;
        else if (slot === 2) color = COLORS.cream;
        else color = COLORS.forest900;
      } else {
        // Stilt-house roof chevron (cream)
        const dx = Math.abs(nx - 0.5);
        const roofLine = 0.28 + dx * 0.55;
        if (dx <= 0.3 && ny >= roofLine && ny <= roofLine + 0.085) {
          color = COLORS.cream;
        }
        // House pillars & warm hearth window
        if (ny >= 0.48 && ny <= 0.74 && dx <= 0.22) {
          if (dx >= 0.15 || (ny >= 0.48 && ny <= 0.54)) {
            color = COLORS.cream;
          } else if (Math.abs(nx - 0.5) + Math.abs(ny - 0.62) < 0.085) {
            color = COLORS.turmeric;
          }
        }
        // Stilt legs
        if (ny > 0.74 && ny <= 0.82 && (Math.abs(dx - 0.18) < 0.03 || dx < 0.025)) {
          color = COLORS.cream;
        }
      }

      const pxOffset = rowOffset + 1 + x * 4;
      raw[pxOffset] = color[0];
      raw[pxOffset + 1] = color[1];
      raw[pxOffset + 2] = color[2];
      raw[pxOffset + 3] = color[3];
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#163F33"/>
  <rect x="0" y="0" width="64" height="5" fill="#B8431E"/>
  <rect x="8" y="0" width="8" height="5" fill="#E3B23C"/>
  <rect x="24" y="0" width="8" height="5" fill="#FAF6EE"/>
  <rect x="40" y="0" width="8" height="5" fill="#E3B23C"/>
  <path d="M12 31L32 16L52 31V36L32 21L12 36Z" fill="#FAF6EE"/>
  <rect x="18" y="33" width="5" height="19" fill="#FAF6EE"/>
  <rect x="41" y="33" width="5" height="19" fill="#FAF6EE"/>
  <polygon points="32,33 38,39 32,45 26,39" fill="#E3B23C"/>
</svg>
`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');
writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderIconPng(192));
writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderIconPng(512));
process.stdout.write(
  'Generated favicon.svg, pwa-192x192.png, pwa-512x512.png in frontend/public/\n',
);
