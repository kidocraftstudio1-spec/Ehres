import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer with filter byte at start of each scanline (filter type 0 = None)
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG chunks
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idat = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// CRC32 implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Icon drawer: Brand Navy background, golden crescent/star geometry
function drawAppIcon(isMaskable) {
  return (x, y, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxR = w / 2;

    // Corner radius check for non-maskable (standard squircle)
    if (!isMaskable) {
      const radius = w * 0.22;
      const rx = Math.max(0, Math.abs(dx) - (w / 2 - radius));
      const ry = Math.max(0, Math.abs(dy) - (h / 2 - radius));
      if (Math.sqrt(rx * rx + ry * ry) > radius) {
        return [0, 0, 0, 0]; // Transparent outside squircle
      }
    }

    // Background gradient: Midnight navy (#0f172a to #1e293b)
    const t = (x + y) / (w + h);
    let r = Math.round(15 + t * 15);
    let g = Math.round(23 + t * 18);
    let b = Math.round(42 + t * 17);

    // Inner safe zone scale factor
    const scale = isMaskable ? 0.72 : 0.85;
    const sDx = dx / scale;
    const sDy = dy / scale;
    const sDist = Math.sqrt(sDx * sDx + sDy * sDy);

    // Crescent moon feature (spiritual)
    const crescentOuter = maxR * 0.46;
    const crescentInner = maxR * 0.40;
    const c1x = -maxR * 0.05;
    const c1y = -maxR * 0.05;
    const d1 = Math.sqrt((sDx - c1x) ** 2 + (sDy - c1y) ** 2);
    const d2 = Math.sqrt((sDx - (c1x + maxR * 0.15)) ** 2 + (sDy - (c1y - maxR * 0.1)) ** 2);

    if (d1 < crescentOuter && d2 > crescentInner) {
      // Emerald glowing gradient for crescent
      return [16, 185, 129, 255]; // #10B981
    }

    // Open book / knowledge chevron below center
    if (sDy > maxR * 0.05 && sDy < maxR * 0.38) {
      const bookX = Math.abs(sDx);
      const bookY = sDy - maxR * 0.05;
      const expectedY = bookX * 0.35 + 8;
      if (Math.abs(bookY - expectedY) < maxR * 0.06 && bookX < maxR * 0.45) {
        return [248, 250, 252, 250]; // White pages
      }
      // Spine
      if (bookX < 5 && sDy < maxR * 0.35) {
        return [245, 158, 11, 255]; // Gold spine
      }
    }

    // Star beacon
    const starDist = Math.sqrt((sDx - maxR * 0.22) ** 2 + (sDy + maxR * 0.22) ** 2);
    if (starDist < maxR * 0.09) {
      return [245, 158, 11, 255]; // Warm Gold #f59e0b
    }

    return [r, g, b, 255];
  };
}

function createICO(pngBuffer, width = 32, height = 32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(1, 4); // Count = 1

  const entry = Buffer.alloc(16);
  entry.writeUInt8(width >= 256 ? 0 : width, 0);
  entry.writeUInt8(height >= 256 ? 0 : height, 1);
  entry.writeUInt8(0, 2); // Color count
  entry.writeUInt8(0, 3); // Reserved
  entry.writeUInt16LE(1, 4); // Color planes
  entry.writeUInt16LE(32, 6); // Bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // Size
  entry.writeUInt32LE(22, 12); // Offset: 6 + 16 = 22

  return Buffer.concat([header, entry, pngBuffer]);
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

const faviconPNG = createPNG(32, 32, drawAppIcon(false));
const appleTouchIconPNG = createPNG(180, 180, drawAppIcon(false));

fs.writeFileSync('./public/favicon.ico', createICO(faviconPNG, 32, 32));
fs.writeFileSync('./public/favicon.png', faviconPNG);
fs.writeFileSync('./public/pwa-192x192.png', createPNG(192, 192, drawAppIcon(false)));
fs.writeFileSync('./public/pwa-512x512.png', createPNG(512, 512, drawAppIcon(false)));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPNG(512, 512, drawAppIcon(true)));
fs.writeFileSync('./public/apple-touch-icon.png', appleTouchIconPNG);
fs.writeFileSync('./public/apple-touch-icon-precomposed.png', appleTouchIconPNG);

const manifest = {
  id: '/',
  name: 'احرص - منصة التفوق والالتزام',
  short_name: 'احرص',
  description: 'رفيقك الذكي للتفوق الدراسي والالتزام الروحي لطلاب الثانوية العامة المصرية',
  theme_color: '#0F766E',
  background_color: '#091419',
  display: 'standalone',
  start_url: '/',
  scope: '/',
  dir: 'rtl',
  lang: 'ar',
  icons: [
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};
fs.writeFileSync('./public/manifest.json', JSON.stringify(manifest, null, 2));
fs.writeFileSync('./public/manifest.webmanifest', JSON.stringify(manifest, null, 2));

const swScript = `// Ehres Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through in development / standard fallback
});
`;
fs.writeFileSync('./public/sw.js', swScript);

const registerSWScript = `if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}
`;
fs.writeFileSync('./public/registerSW.js', registerSWScript);

console.log('Successfully generated PWA icon assets, favicon.ico, manifest.json, manifest.webmanifest, sw.js, and registerSW.js!');
