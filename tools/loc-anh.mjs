import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { open, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const exec = promisify(execFile);
const formats = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.heic': 'heic', '.webp': 'webp' };
const cacheVersion = 2;
// Body Oil (92 ảnh): nét 0.036/0.088/0.224, sáng 0.371/0.517/0.805 (min/trung vị/max).
// Giữ cả ảnh ít nét/sáng nhất còn rõ chủ thể. 88 ảnh giữ, 4 gần trùng qua đối chiếu bằng mắt.
const minSharpness = 0.028;
const minBrightness = 0.16;

async function score(file, format) {
  const handle = await open(file, constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW);
  try {
    if (!(await handle.stat()).isFile()) throw new Error('Cần file ảnh thường');
    const result = exec('magick', ['-limit', 'thread', '1', '-define', 'jpeg:size=1024x1024',
      '--', `${format}:-[0]`, '-auto-orient', '-background', 'black', '-alpha', 'remove',
      '-colorspace', 'Gray', '-resize', '512x512>', '-depth', '8',
      '-format', '%w %h\n', '-write', 'info:-', '-write', 'gray:-', '-resize', '32x32!',
      '-write', 'gray:-', '-resize', '8x8!', 'gray:-'],
    { encoding: 'buffer', timeout: 15000, maxBuffer: 512 * 1024 });
    result.child.stdin.on('error', () => {});
    const stream = handle.createReadStream({ autoClose: false });
    stream.on('error', error => result.child.stdin.destroy(error)).pipe(result.child.stdin);
    let stdout;
    try { ({ stdout } = await result); }
    finally { stream.destroy(); }
    const end = stdout.indexOf(10);
    const [width, height] = stdout.subarray(0, end).toString().split(' ').map(Number);
    const count = width * height;
    if (!count || stdout.length !== end + 1 + count + 1024 + 64) throw new Error('Không đọc được điểm ảnh');
    const gray = stdout.subarray(end + 1, end + 1 + count);
    const small = stdout.subarray(-64);
    const average = small.reduce((sum, pixel) => sum + pixel, 0) / 64;
    const bam = BigInt('0b' + [...small].map(pixel => pixel > average ? '1' : '0').join('')).toString(16).padStart(16, '0');
    let sum = 0;
    let squares = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const laplacian = gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i];
        sum += laplacian;
        squares += laplacian * laplacian;
      }
    }
    const interior = Math.max(1, (width - 2) * (height - 2));
    return { net: Math.sqrt(Math.max(0, squares / interior - (sum / interior) ** 2)) / 255,
      sang: gray.reduce((total, pixel) => total + pixel, 0) / count / 255, bam, ty_le: width / height,
      nho: stdout.subarray(-1088, -64).toString('base64') };
  } finally { await handle.close(); }
}

function nearHash(first, second) {
  let bits = BigInt('0x' + first) ^ BigInt('0x' + second);
  for (let diff = 0; bits; diff++, bits &= bits - 1n) {
    if (diff === 6) return false;
  }
  return true;
}

function sameScene(first, second) {
  // Hash có thể trùng dù khác ánh sáng hoặc vị trí cầm chai.
  if (Math.abs(first.ty_le - second.ty_le) > 0.015 || Math.abs(first.sang - second.sang) > 0.04 ||
      !nearHash(first.bam, second.bam)) return false;
  const a = Buffer.from(first.nho, 'base64');
  const b = Buffer.from(second.nho, 'base64');
  let squares = 0;
  for (let index = 0; index < a.length; index++) squares += (a[index] - b[index]) ** 2;
  return Math.sqrt(squares / a.length) / 255 <= 0.074;
}

async function loadCache(file) {
  let handle;
  try {
    handle = await open(file, constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW);
    const info = await handle.stat();
    if (!info.isFile() || info.nlink !== 1) return {};
    const data = JSON.parse(await handle.readFile('utf8'));
    if (data?.version === cacheVersion && data.anh && typeof data.anh === 'object' && !Array.isArray(data.anh)) return data.anh;
  } catch (error) {
    if (!(error instanceof SyntaxError) && !['ENOENT', 'ELOOP'].includes(error.code)) throw error;
  } finally { await handle?.close(); }
  return {};
}

async function saveCache(file, photos) {
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temp, JSON.stringify({ version: cacheVersion, anh: photos }) + '\n', { flag: 'wx', mode: 0o600 });
    await rename(temp, file);
  } finally { await rm(temp, { force: true }); }
}

export async function locAnh(folder, { all = false, cache = path.join(folder, '.cham-anh.json') } = {}) {
  const names = (await readdir(folder, { withFileTypes: true }))
    .filter(entry => entry.isFile() && Object.hasOwn(formats, path.extname(entry.name).toLowerCase()))
    .map(entry => entry.name).sort();
  if (all) return names.map(ten => ({ ten }));
  const previous = await loadCache(cache);
  const photos = Object.create(null);
  const results = [];
  for (const ten of names) {
    const file = path.join(folder, ten);
    const { mtimeMs, size } = await stat(file);
    let marks = previous?.[ten];
    if (marks?.mtimeMs !== mtimeMs || marks?.size !== size || !/^[a-f0-9]{16}$/.test(marks?.bam) ||
        !Number.isFinite(marks.net) || !Number.isFinite(marks.sang) || !Number.isFinite(marks.ty_le) ||
        typeof marks.nho !== 'string' || Buffer.byteLength(marks.nho, 'base64') !== 1024) {
      try {
        marks = { mtimeMs, size, ...await score(file, formats[path.extname(file).toLowerCase()]) };
      } catch (error) {
        console.error(`Không chấm được ${ten}: ${error.message}`);
        results.push({ ten });
        continue;
      }
    }
    photos[ten] = marks;
    results.push({ ten, net: marks.net, sang: marks.sang, bam: marks.bam });
  }
  if (JSON.stringify(photos) !== JSON.stringify(previous)) await saveCache(cache, photos);
  const kept = [];
  for (const photo of results.filter(photo => photo.bam).sort((a, b) => b.net - a.net)) {
    if (photo.sang < minBrightness) photo.loai = 'toi';
    else if (photo.net < minSharpness) photo.loai = 'mo';
    else {
      const near = kept.find(other => sameScene(photos[photo.ten], photos[other.ten]));
      if (near) Object.assign(photo, { loai: 'gan-trung', giu: near.ten });
      else kept.push(photo);
    }
  }
  return results;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [product, ...options] = process.argv.slice(2);
    const nul = options.at(-1) === '--nul';
    if (nul) options.pop();
    const [mode, ...extra] = options;
    if (!/^[a-z0-9-]+$/.test(product ?? '') || extra.length || ![undefined, '--tat-ca', '--diem'].includes(mode)) {
      throw new Error('Dùng: node tools/loc-anh.mjs <sp> [--tat-ca|--diem]');
    }
    const photos = await locAnh(path.join(root, 'nguon', product),
      { all: mode === '--tat-ca', cache: process.env.LOC_ANH_CACHE });
    if (mode === '--diem') console.log(JSON.stringify(photos, null, 2));
    else for (const photo of photos) if (!photo.loai) process.stdout.write(`${photo.ten}${nul ? '\0' : '\n'}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
