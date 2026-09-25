/*
 * Build the Dlea brand assets from the raw logo PNG.
 *
 * Zero-dependency: it inflates the PNG with zlib, decodes/encodes scanlines
 * itself, then:
 *   1. makes the dark navy background fully transparent (alpha = distance
 *      from the dark corner color, dithered by the anti-aliased edges),
 *   2. rotates hues toward green (the brand primary) while keeping the
 *      original gradient's lightness pattern,
 *   3. emits public/favicon.png (512) and public/logo-192.png.
 *
 * Run: node scripts/make-logo.cjs dlea-logo-src.png
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ---------- PNG decode ----------
function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let pos = 8;
  let w = 0,
    h = 0,
    bitDepth = 0,
    colorType = 0;
  const idat = [];
  let palette = null,
    trns = null;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "PLTE") palette = Buffer.from(data);
    else if (type === "tRNS") trns = Buffer.from(data);
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error("bit depth " + bitDepth + " unsupported");
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const out = Buffer.alloc(w * h * 4); // RGBA
  const prev = Buffer.alloc(stride);
  let cur = Buffer.alloc(stride);
  let p = 0;
  const paeth = (a, b, c) => {
    const pa = Math.abs(b - c),
      pb = Math.abs(a - c),
      pc = Math.abs(a + b - 2 * c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const filter = raw[p++];
    for (let i = 0; i < stride; i++) {
      const x = raw[p++];
      const left = i >= channels ? cur[i - channels] : 0;
      const up = prev[i];
      const ul = i >= channels ? prev[i - channels] : 0;
      let v;
      switch (filter) {
        case 0: v = x; break;
        case 1: v = x + left; break;
        case 2: v = x + up; break;
        case 3: v = x + ((left + up) >> 1); break;
        case 4: v = x + paeth(left, up, ul); break;
        default: throw new Error("bad filter " + filter);
      }
      cur[i] = v & 0xff;
    }
    for (let x = 0; x < w; x++) {
      const si = x * channels;
      const di = (y * w + x) * 4;
      if (colorType === 2) {
        out[di] = cur[si]; out[di + 1] = cur[si + 1]; out[di + 2] = cur[si + 2]; out[di + 3] = 255;
      } else if (colorType === 6) {
        out[di] = cur[si]; out[di + 1] = cur[si + 1]; out[di + 2] = cur[si + 2]; out[di + 3] = cur[si + 3];
      } else if (colorType === 0) {
        out[di] = out[di + 1] = out[di + 2] = cur[si]; out[di + 3] = 255;
      } else if (colorType === 4) {
        out[di] = out[di + 1] = out[di + 2] = cur[si]; out[di + 3] = cur[si + 1];
      } else if (colorType === 3) {
        const idx = cur[si];
        out[di] = palette[idx * 3]; out[di + 1] = palette[idx * 3 + 1]; out[di + 2] = palette[idx * 3 + 2];
        out[di + 3] = trns && idx < trns.length ? trns[idx] : 255;
      }
    }
    prev.set(cur);
  }
  return { w, h, data: out };
}

// ---------- PNG encode (RGBA, filter 0) ----------
function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- color helpers ----------
function hex(n) { return n.toString(16).padStart(2, "0"); }
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hh;
  if (max === r) hh = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) hh = (b - r) / d + 2;
  else hh = (r - g) / d + 4;
  return [hh * 60, s, l];
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---------- main ----------
const srcPath = process.argv[2] || "dlea-logo-src.png";
const { w, h, data } = decodePNG(fs.readFileSync(srcPath));
console.log(`source: ${w}x${h}`);

// Background reference: sample the top-left corner (dark navy).
const bg = [data[0], data[1], data[2]];
const bgLum = luminance(...bg);
console.log(`background rgb: ${bg.join(",")} (lum ${bgLum.toFixed(0)})`);

// Foreground pixels are much brighter than the navy backdrop.
const threshold = Math.max(60, bgLum + 45);

const targetHue = 150; // brand green
const rgba = Buffer.alloc(w * h * 4);
let transparent = 0, tinted = 0;
for (let i = 0; i < w * h; i++) {
  const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
  const a = data[i * 4 + 3];
  const lum = luminance(r, g, b);
  // Alpha: fully transparent on the backdrop, opaque on the mark; the gap
  // becomes a smooth edge so there is no dark halo at small sizes.
  let alpha = Math.max(0, Math.min(1, (lum - bgLum - 10) / (threshold - bgLum)));
  if (a < 255) alpha *= a / 255;
  const A = Math.round(alpha * 255);
  if (A === 0) { transparent++; rgba[i * 4 + 3] = 0; continue; }
  // Shift hue toward green; keep the source gradient's lightness so the mark
  // still reads as a gradient, and drop saturation a touch at low lightness.
  const [hh, s, l] = rgbToHsl(r, g, b);
  const dist = ((hh - targetHue + 540) % 360) - 180; // signed hue distance
  const newH = hh - dist * 0.75;
  const [nr, ng, nb] = hslToRgb(newH, s * 0.95, l);
  rgba[i * 4] = nr; rgba[i * 4 + 1] = ng; rgba[i * 4 + 2] = nb; rgba[i * 4 + 3] = A;
  tinted++;
}
console.log(`pixels: ${tinted} tinted, ${transparent} transparent`);

// Trim transparent margins so the mark fills the frame at small sizes.
let minX = w, minY = h, maxX = 0, maxY = 0;
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++)
    if (rgba[(y * w + x) * 4 + 3] > 8) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
if (maxX <= minX || maxY <= minY) throw new Error("nothing visible after keying");
const tw = maxX - minX + 1, th = maxY - minY + 1;
const trim = Buffer.alloc(tw * th * 4);
for (let y = 0; y < th; y++)
  rgba.copy(trim, y * tw * 4, ((y + minY) * w + minX) * 4, ((y + minY) * w + minX + tw) * 4);
console.log(`trimmed to ${tw}x${th}`);

// Pad to a square canvas with a small margin.
const size = Math.max(tw, th);
const margin = Math.round(size * 0.06);
const canvas = size + margin * 2;
const square = Buffer.alloc(canvas * canvas * 4);
const ox = Math.floor((canvas - tw) / 2), oy = Math.floor((canvas - th) / 2);
for (let y = 0; y < th; y++)
  trim.copy(square, ((y + oy) * canvas + ox) * 4, y * tw * 4, (y * tw + tw) * 4);

// Box-filter downscale.
function resize(buf, sw, sh, dw, dh) {
  const out = Buffer.alloc(dw * dh * 4);
  const xr = sw / dw, yr = sh / dh;
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * yr), y1 = Math.min(sh, Math.max(y0 + 1, Math.floor((y + 1) * yr)));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * xr), x1 = Math.min(sw, Math.max(x0 + 1, Math.floor((x + 1) * xr)));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++)
        for (let xx = x0; xx < x1; xx++) {
          const pi = (yy * sw + xx) * 4;
          // Un-premultiply against alpha for a cleaner downscale.
          const pa = buf[pi + 3] / 255;
          r += buf[pi] * pa; g += buf[pi + 1] * pa; b += buf[pi + 2] * pa; a += buf[pi + 3];
          n++;
        }
      const di = (y * dw + x) * 4;
      const aw = a / 255 / n;
      if (aw > 0.001) {
        out[di] = Math.min(255, Math.round(r / n / aw));
        out[di + 1] = Math.min(255, Math.round(g / n / aw));
        out[di + 2] = Math.min(255, Math.round(b / n / aw));
      }
      out[di + 3] = Math.round(a / n);
    }
  }
  return out;
}

const outDir = "public";
fs.mkdirSync(outDir, { recursive: true });
for (const dim of [512, 192, 64, 48, 32]) {
  const img = resize(square, canvas, canvas, dim, dim);
  const name = dim === 512 ? "favicon.png" : `logo-${dim}.png`;
  fs.writeFileSync(path.join(outDir, name), encodePNG(dim, dim, img));
  console.log(`wrote public/${name}`);
}
