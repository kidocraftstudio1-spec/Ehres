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

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/pwa-192x192.png', createPNG(192, 192, drawAppIcon(false)));
fs.writeFileSync('./public/pwa-512x512.png', createPNG(512, 512, drawAppIcon(false)));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPNG(512, 512, drawAppIcon(true)));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180, 180, drawAppIcon(false)));
console.log('Successfully generated PWA icon assets!');
