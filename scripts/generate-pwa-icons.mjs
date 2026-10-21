#!/usr/bin/env node
/**
 * Sherivs — generate the installable PWA icons.
 *
 * The manifest engine declares icons at /icons/icon-192.png, /icons/icon-512.png
 * and /icons/maskable-512.png. Those files must EXIST or "installability
 * validated" would be a lie, so they are generated here — deterministically,
 * with no image dependency — from a brand colour.
 *
 * The mark is a white frame over the brand colour: an organization-neutral glyph
 * (no letterform that would be wrong for a different organization). Maskable
 * icons keep the mark inside the safe area so Android can crop any shape.
 *
 * Usage:
 *   node scripts/generate-pwa-icons.mjs                 # default brand colour
 *   node scripts/generate-pwa-icons.mjs --color=#0f766e
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = join(ROOT, "public", "icons");

const colorArg = process.argv.find((arg) => arg.startsWith("--color="));
const BRAND = colorArg ? colorArg.slice("--color=".length) : "#1d4ed8";
if (!/^#[0-9a-fA-F]{6}$/.test(BRAND)) {
  console.error(`--color must be #RRGGBB (received "${BRAND}")`);
  process.exit(2);
}

const brand = [
  parseInt(BRAND.slice(1, 3), 16),
  parseInt(BRAND.slice(3, 5), 16),
  parseInt(BRAND.slice(5, 7), 16),
];

/* ── Minimal PNG encoder (8-bit RGBA, filter 0) ───────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ── The mark: a white frame with a brand-coloured window ─────────────────── */

/**
 * @param size    canvas size in pixels
 * @param inset   mark inset as a fraction of the canvas (maskable keeps 20%)
 * @param corner  corner radius as a fraction of the mark size
 */
function drawIcon(size, inset, corner, monochrome) {
  const pixels = Buffer.alloc(size * size * 4);
  const mark = Math.round(size * (1 - inset * 2));
  const offset = Math.round((size - mark) / 2);
  const radius = Math.max(2, Math.round(mark * corner));
  const border = Math.max(2, Math.round(mark * 0.09));
  const window = Math.round(mark * 0.34);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      // Brand background (maskable icons paint the full canvas).
      let colour = brand;
      const inMark = x >= offset && x < offset + mark && y >= offset && y < offset + mark;
      if (inMark) {
        const localX = x - offset;
        const localY = y - offset;
        if (!insideRounded(localX, localY, mark, radius, border)) colour = [255, 255, 255];
      }
      if (monochrome) colour = brand;
      pixels[index] = colour[0];
      pixels[index + 1] = colour[1];
      pixels[index + 2] = colour[2];
      pixels[index + 3] = 255;
    }
  }

  // Window (brand-coloured square) inside the white frame.
  const windowStart = offset + Math.round((mark - window) / 2);
  for (let y = windowStart; y < windowStart + window; y += 1) {
    for (let x = windowStart; x < windowStart + window; x += 1) {
      const index = (y * size + x) * 4;
      pixels[index] = brand[0];
      pixels[index + 1] = brand[1];
      pixels[index + 2] = brand[2];
      pixels[index + 3] = 255;
    }
  }

  return pixels;
}

/** True when (x, y) is inside a rounded square that is at least `border` from the edge. */
function insideRounded(x, y, size, radius, border) {
  const inner = { x: x - border, y: y - border, size: size - border * 2 };
  if (inner.size <= 0) return true;
  if (inner.x < 0 || inner.y < 0 || inner.x >= inner.size || inner.y >= inner.size) return true;
  const cx = Math.min(Math.max(inner.x, radius), inner.size - 1 - radius);
  const cy = Math.min(Math.max(inner.y, radius), inner.size - 1 - radius);
  const dx = inner.x - cx;
  const dy = inner.y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

const OUTPUTS = [
  { file: "icon-192.png", size: 192, inset: 0.12, corner: 0.22 },
  { file: "icon-512.png", size: 512, inset: 0.12, corner: 0.22 },
  { file: "maskable-512.png", size: 512, inset: 0.22, corner: 0.22 },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const output of OUTPUTS) {
  const png = encodePng(output.size, drawIcon(output.size, output.inset, output.corner, false));
  writeFileSync(join(OUT_DIR, output.file), png);
  console.log(
    `OK    public/icons/${output.file} — ${output.size}×${output.size}, ${png.length} bytes`,
  );
}
console.log(`Generated ${OUTPUTS.length} PWA icons from ${BRAND}.`);
