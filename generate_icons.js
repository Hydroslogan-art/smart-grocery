const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create icons directory
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to generate a simple RGBA PNG buffer with cart motif
function createPng(size) {
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdr);
  
  // Create scanlines: filter byte (0) + width * 4 bytes
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLength * height);
  
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Background rounded circle gradient: Emerald (#10b981) to Dark Teal (#047857)
      if (dist <= radius) {
        const factor = (y / height);
        const r = Math.round(16 * (1 - factor) + 4 * factor);
        const g = Math.round(185 * (1 - factor) + 120 * factor);
        const b = Math.round(129 * (1 - factor) + 87 * factor);
        
        // Inner cart basket area
        const cartX = (x / width);
        const cartY = (y / height);
        const isCartHandle = cartY >= 0.30 && cartY <= 0.34 && cartX >= 0.22 && cartX <= 0.34;
        const isCartTop = cartY >= 0.34 && cartY <= 0.38 && cartX >= 0.30 && cartX <= 0.76;
        const isCartBody = cartY >= 0.38 && cartY <= 0.58 && cartX >= 0.32 && cartX <= (0.76 - (cartY - 0.38) * 0.2);
        const isWheel1 = Math.hypot(cartX - 0.40, cartY - 0.68) < 0.05;
        const isWheel2 = Math.hypot(cartX - 0.64, cartY - 0.68) < 0.05;
        const isCoin = Math.hypot(cartX - 0.52, cartY - 0.45) < 0.06;

        if (isWheel1 || isWheel2 || isCartHandle || isCartTop || isCoin) {
          // White or Gold highlight
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = isCoin ? 220 : 255;
          rawData[pxOffset + 2] = isCoin ? 50 : 255;
          rawData[pxOffset + 3] = 255;
        } else if (isCartBody) {
          rawData[pxOffset] = 240;
          rawData[pxOffset + 1] = 253;
          rawData[pxOffset + 2] = 244;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Transparent outside circle
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  
  // calculate crc32
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512));
console.log('Icons generated successfully!');
